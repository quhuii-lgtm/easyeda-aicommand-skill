import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkPlacementDfm } from './check-pcb-placement.mjs';

const mmPerMil = 0.0254;
const stages = ['placement', 'routing', 'repour', 'manufacturing'];
const positive = value => Number.isFinite(value) && value > 0;
const text = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => createHash('sha256').update(value).digest('hex');
const below = (actual, limit) => actual + 1e-9 < limit;

export function checkViaDrills(source, docUuid, minimumGapMm) {
	const records = new Map();
	let document;
	for (const line of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
		if (!line.trim()) continue;
		const separator = line.indexOf('||');
		if (separator < 0) throw new Error('PCB 源码格式无法识别');
		const header = JSON.parse(line.slice(0, separator));
		if (!['DOCHEAD', 'VIA'].includes(header.type)) continue;
		const value = line.slice(separator + 2).replace(/\|$/, '');
		const data = value ? JSON.parse(value) : null;
		if (header.type === 'DOCHEAD') {
			document = data;
			continue;
		}
		if (!text(header.id) || !Number.isSafeInteger(header.ticket)) throw new Error('过孔记录缺少 ID 或修订序号');
		if (header.ticket >= (records.get(header.id)?.ticket ?? -Infinity)) records.set(header.id, { ticket: header.ticket, data });
	}
	if (document?.docType !== 'PCB' || document.uuid !== docUuid) throw new Error('源码与目标 PCB 不符');
	const vias = [], unsupported = [], findings = [];
	for (const [id, { data }] of records) {
		if (data === null || data === '') continue;
		const { centerX: x, centerY: y, holeDiameter: hole, viaDiameter: outer, viaType, netName: net } = data;
		if (viaType !== 'NORMAL' || ![x, y].every(Number.isFinite) || !positive(hole) || !positive(outer)) {
			unsupported.push({ id, reason: '非常规过孔或缺精确孔径、位置' });
			continue;
		}
		if (outer <= hole) findings.push({ check: 'via-annular-ring', id, net, x, y, holeMm: hole * mmPerMil, outerMm: outer * mmPerMil });
		vias.push({ id, net, x, y, hole });
	}
	vias.sort((a, b) => a.x - b.x);
	const maxHoleMil = vias.reduce((maximum, via) => Math.max(maximum, via.hole), 0);
	if (positive(minimumGapMm)) {
		for (let i = 0; i < vias.length; i++) {
			const a = vias[i];
			for (let j = i + 1; j < vias.length; j++) {
				const b = vias[j];
				if ((b.x - a.x - (a.hole + maxHoleMil) / 2) * mmPerMil > minimumGapMm) break;
				const gapMm = (Math.hypot(b.x - a.x, b.y - a.y) - (a.hole + b.hole) / 2) * mmPerMil;
				if (below(gapMm, minimumGapMm)) findings.push({ check: 'via-hole-to-hole', a, b, gapMm, minimumGapMm });
			}
		}
	}
	return { count: vias.length, minimumGapMm: minimumGapMm ?? null, positionUnit: 'mil', includesSameNet: true, findings, unsupported };
}

export async function checkPcbStage(config, root, send) {
	const { stage, projectUuid, docUuid, instanceId, process: processRules = {} } = config;
	if (!stages.includes(stage) || ![projectUuid, docUuid, instanceId].every(text)) throw new Error('需要阶段、实例、工程 UUID 和 PCB UUID');
	for (const key of ['minimumViaHoleGapMm', 'minimumMaskBridgeMm']) {
		if (processRules[key] !== undefined && !positive(processRules[key])) throw new Error(`${key} 必须为正的毫米数`);
	}
	const report = { stage, target: { instanceId, projectUuid, docUuid }, processSource: processRules.source ?? null,
		readOnly: true, checks: {}, findings: [], pending: [] };
	const pending = (check, reason) => report.pending.push({ check, reason });
	const finding = (check, detail) => report.findings.push({ check, detail });
	const readJson = async file => JSON.parse((await readFile(resolve(root, file), 'utf8')).replace(/^\uFEFF/, ''));
	const readZip = async file => (await readFile(resolve(root, file))).toString('base64');
	const targetParams = { __projectUuid: projectUuid, __docUuid: docUuid };
	const check = async (cmd, params = {}) => {
		try {
			const result = await send(cmd, { ...params, ...targetParams });
			if (result === undefined || result === null) throw new Error('未返回结果');
			return result;
		}
		catch (error) {
			pending(cmd, error.message);
			return undefined;
		}
	};
	const revision = await check('pcb.getRevision');
	if (!/^[0-9a-f]{64}$/i.test(revision?.digest ?? '') || revision.target?.uuid !== docUuid
		|| revision.target?.parentProjectUuid !== projectUuid) {
		pending('revision', '无法确认当前工程、PCB 和修订');
		return { ...report, status: 'incomplete' };
	}
	report.revision = revision.digest;
	const confirmedProcess = text(processRules.source);
	if (!confirmedProcess) pending('process', '缺适用于本次订单的工艺参数来源');

	if (stage === 'placement') {
		if (config.placementFile) {
			const input = await readJson(config.placementFile);
			if (input.revision !== report.revision) pending('placement', '摆放清单与当前板修订不一致');
			else {
				const result = checkPlacementDfm(input);
				report.checks.placement = result;
				for (const item of result.findings) finding('placement', item);
				for (const item of result.unresolved) pending('placement', item);
			}
		}
		else pending('placement', '缺实配尺寸、板框和装配清单');
		pending('assembly-details', '夹持区、V 割、跨板干涉与引脚/极性匹配须结合实际装配核对');
	}
	else {
		const drc = await check('pcb.runDrcDetailed');
		if (drc) {
			report.checks.drc = drc;
			if (drc.totalCount > 0) finding('native-drc', { count: drc.totalCount });
			if (drc.incomplete || drc.passed !== true || drc.coverage?.ruleCoverage === 'unknown') pending('native-drc', '核对 DRC 明细和实际规则覆盖');
		}
		if (confirmedProcess && processRules.pcbDfm) {
			const result = await check('pcb.runDfm', processRules.pcbDfm);
			if (result) {
				report.checks.pcbDfm = result;
				if (result.complete && result.passed === false) finding('pcb-dfm', { results: result.results });
				if (!result.complete || result.checkScope?.revision !== report.revision) pending('pcb-dfm', '检查项或修订证据未齐');
			}
		}
		else pending('pcb-dfm', '缺板材、板厚和订单铜厚');
		const source = await check('project.getDocumentSource');
		if (source) {
			try {
				const holes = checkViaDrills(source.source, docUuid, confirmedProcess ? processRules.minimumViaHoleGapMm : undefined);
				report.checks.viaDrills = holes;
				for (const item of holes.findings) finding(item.check, item);
				if (!holes.minimumGapMm || holes.unsupported.length) pending('via-drills', '过孔孔距规则或非常规过孔几何未齐');
			}
			catch (error) { pending('via-drills', error.message); }
		}
		pending('drill-and-edge', '补查各层孔到铜、插件孔/机械孔间距、铜到板边/槽/V割及实际成品孔公差');
	}

	if (stage === 'routing') {
		if (config.routing) {
			const result = await check('pcb.reviewLocalRouting', config.routing);
			if (result) {
				report.checks.routing = result;
				pending('routing', '核对局部接触、间距及转角证据，再与全板连接和既有结果对照');
			}
		}
		else pending('routing', '缺本批网络或区域');
	}
	if (stage === 'repour') {
		const pours = await check('pcb.listPours', { withFill: true });
		if (Array.isArray(pours)) {
			report.checks.pours = pours.map(({ primitiveId, net, layer, fillStatus, fillReadError }) => ({ primitiveId, net, layer, fillStatus, fillReadError }));
			for (const pour of report.checks.pours) {
				if (pour.fillStatus !== 'filled') pending('pour-fill', pour);
			}
		}
		report.checks.copperSections = [];
		for (const { primitiveId, sections } of config.copper ?? []) {
			if (!text(primitiveId) || !sections?.length || sections.some(section => !positive(section.minimumMm)) || new Set(sections.map(s => s.id)).size !== sections.length)
				throw new Error('实铜截面需要覆铜 ID、唯一截面 ID、端点及最小宽度');
			const result = await check('pcb.reviewCopperShape', { primitiveId, crossSections: sections.map(({ id, start, end }) => ({ id, start, end })) });
			if (!result) continue;
			report.checks.copperSections.push({ primitiveId, result });
			for (const { id, minimumMm } of sections) {
				const section = result.crossSections?.find(section => section.id === id);
				const spans = section?.copperSpansMil;
				if (!Array.isArray(spans) || spans.some(value => !positive(value))) pending('copper-section', { primitiveId, id });
				else if (below(Math.max(0, ...spans) * mmPerMil, minimumMm)) finding('copper-section', { primitiveId, id, minimumMm, spans });
				else if (spans.length !== 1) pending('copper-section', { primitiveId, id, reason: '截面包含多个铜段，须核对哪一段属于目标铜路' });
			}
		}
		pending('copper-continuity', '补查关键主干实铜连接、重铺新增断接、孤岛与未指定截面的铜颈');
	}

	if (stage === 'placement' || stage === 'manufacturing') {
		const files = config.manufacturing;
		let archive;
		if (stage === 'placement' && files?.exportTemporary === true) {
			const result = await check('pcb.exportGerber', { fileName: 'placement-dfm-temporary' });
			archive = result?.base64;
			if (archive && files.saveTemporaryAs) await writeFile(resolve(root, files.saveTemporaryAs), Buffer.from(archive, 'base64'), { flag: 'wx' });
		}
		else if (files?.gerber && files.revision === report.revision) archive = await readZip(files.gerber);
		if (!archive) pending('gerber', '缺来自当前修订的 Gerber ZIP');
		else {
			const minimum = confirmedProcess ? processRules.minimumMaskBridgeMm : undefined;
			if (!minimum) pending('mask-bridge', '缺实际开窗桥宽的确认阈值');
			const assembly = files.assembly ? { ...files.assembly,
				bomBase64: await readZip(files.assembly.bom), placementBase64: await readZip(files.assembly.placement),
				...(files.assembly.assignment ? { assignmentBase64: await readZip(files.assembly.assignment) } : {}) } : undefined;
			if (assembly) for (const key of ['bom', 'placement', 'assignment']) delete assembly[key];
			const result = await check('dfm.inspectManufacturingFiles', { gerberBase64: archive, object: files.object ?? 'single-board',
				...(minimum ? { minimumMaskBridgeMm: minimum } : {}), ...(assembly ? { assembly } : {}),
				...(files.stencil ? { stencilBase64: await readZip(files.stencil) } : {}) });
			if (result) {
				report.checks.manufacturing = { archiveSha256: digest(Buffer.from(archive, 'base64')), result };
				for (const layer of result.mask?.layers ?? []) {
					for (const pair of layer.findings ?? []) {
						if (minimum && below(pair.upperBoundMil * mmPerMil, minimum)) finding('mask-bridge', { side: layer.side, pair, minimum });
						else pending('mask-bridge', { side: layer.side, pair });
					}
				}
				if (!result.mask?.complete || result.fileIssues?.length) pending('gerber', '制造文件解析或阻焊覆盖有缺项');
			}
			pending('mask-opening-merges', '检查密脚开窗合并并归属到位号和焊盘，独立开窗间距结果不能覆盖已合并开窗');
			if (stage === 'manufacturing') {
				report.checks.package = await check('pcb.inspectManufacturingPackage', { base64: archive });
				pending('manufacturing-review', '核对拼板、机贴名单、孔与实际钢网开口以及板厂工艺条件');
			}
		}
	}
	const after = await check('pcb.getRevision', { expectedDigest: revision.digest });
	report.freshness = after?.target?.uuid === docUuid && after.target.parentProjectUuid === projectUuid
		&& after.digest === revision.digest && after.rulesDigest === revision.rulesDigest ? 'current'
		: after?.digest ? 'stale' : 'unknown';
	if (report.freshness !== 'current') pending('revision', '检查后板卡或修订无法再次确认，结果不可作为当前板结论');
	return { ...report, status: report.freshness !== 'current' ? 'incomplete' : report.findings.length ? 'fail' : report.pending.length ? 'incomplete' : 'pass' };
}

async function main(file) {
	if (!file) throw new Error('用法：node check-pcb-stage.mjs stage.json');
	const config = JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
	const base = new URL(config.proxyUrl);
	if (base.protocol !== 'http:' || base.hostname !== '127.0.0.1' || base.pathname !== '/' || base.username || base.password)
		throw new Error('proxyUrl 必须是已经核实的本机 HTTP 代理地址');
	const health = await (await fetch(new URL('/health', base), { signal: AbortSignal.timeout(5000) })).json();
	if (health.service !== 'ai-command-proxy' || health.lifecycleProtocol !== 1) throw new Error('目标端口不是兼容的本机指令代理');
	const send = async (cmd, params) => {
		const response = await fetch(new URL('/command', base), { method: 'POST', headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ instanceId: config.instanceId, cmd, params }), signal: AbortSignal.timeout(125000) });
		const result = await response.json();
		if (!response.ok || result.ok !== true) throw new Error(result.error?.message ?? result.message ?? JSON.stringify(result.error) ?? `HTTP ${response.status}`);
		return result.data;
	};
	const report = await checkPcbStage(config, dirname(resolve(file)), send);
	console.log(JSON.stringify(report, null, 2));
	process.exitCode = { pass: 0, fail: 1, incomplete: 2 }[report.status];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try { await main(process.argv[2]); }
	catch (error) {
		console.error(error.message);
		process.exitCode = 3;
	}
}
