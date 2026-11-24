import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const EPS = 1e-9;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const label = value => typeof value === 'string' && !!value.trim();
const edges = ring => ring.map((a, index) => [a, ring[(index + 1) % ring.length]]);
const cross = ([ax, ay], [bx, by], [cx, cy]) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

function pointToSegment([x, y], [ax, ay], [bx, by]) {
	const dx = bx - ax, dy = by - ay;
	const l2 = dx * dx + dy * dy;
	const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
	return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

function segmentsMeet(a, b, c, d) {
	const ab1 = cross(a, b, c), ab2 = cross(a, b, d);
	const cd1 = cross(c, d, a), cd2 = cross(c, d, b);
	const opposite = (x, y) => (x > EPS && y < -EPS) || (x < -EPS && y > EPS);
	return (opposite(ab1, ab2) && opposite(cd1, cd2))
		|| [pointToSegment(a, c, d), pointToSegment(b, c, d), pointToSegment(c, a, b), pointToSegment(d, a, b)].some(v => v <= EPS);
}

function contains(ring, point) {
	const [x, y] = point;
	let inside = false;
	for (const [a, b] of edges(ring)) {
		if (pointToSegment(point, a, b) <= EPS) return true;
		if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
	}
	return inside;
}

function boundaryGap(first, second) {
	let distance = Infinity;
	for (const [a, b] of edges(first)) {
		for (const [c, d] of edges(second)) {
			if (segmentsMeet(a, b, c, d)) return 0;
			distance = Math.min(distance, pointToSegment(a, c, d), pointToSegment(b, c, d), pointToSegment(c, a, b), pointToSegment(d, a, b));
		}
	}
	return distance;
}

function readRing(ring, name) {
	if (!Array.isArray(ring) || ring.length < 3 || ring.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(finite)))
		throw new Error(`${name} 需要毫米坐标闭环`);
	const points = ring[0].every((v, i) => v === ring.at(-1)[i]) ? ring.slice(0, -1) : ring;
	const segments = edges(points);
	const area = segments.reduce((sum, [a, b]) => sum + a[0] * b[1] - a[1] * b[0], 0);
	if (points.length < 3 || Math.abs(area) <= EPS || new Set(points.map(point => point.join(','))).size !== points.length)
		throw new Error(`${name} 的边界退化或顶点重复`);
	for (let i = 0; i < segments.length; i++) {
		for (let j = i + 2; j < segments.length; j++) {
			if (!(i === 0 && j === segments.length - 1) && segmentsMeet(...segments[i], ...segments[j]))
				throw new Error(`${name} 的边界自交`);
		}
	}
	return points;
}

function bodyPolygon(component) {
	const { widthMm, heightMm, offsetXMm = 0, offsetYMm = 0, rotationOffsetDeg = 0 } = component.body;
	const angle = (component.rotationDeg + rotationOffsetDeg) * Math.PI / 180;
	const cos = Math.cos(angle), sin = Math.sin(angle);
	return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
		const x = sx * widthMm / 2 + offsetXMm, y = sy * heightMm / 2 + offsetYMm;
		return [component.xMm + x * cos - y * sin, component.yMm + x * sin + y * cos];
	});
}

export function checkPlacementDfm(input) {
	if (input.unit !== 'mm' || !label(input.revision) || !Array.isArray(input.components))
		throw new Error('需要毫米坐标、PCB 修订标识和当前器件清单');
	const rules = input.rules ?? {};
	const thresholds = [rules.bodyGapMm, rules.edgeGapMm, rules.slotGapMm ?? rules.edgeGapMm];
	if (thresholds.some(value => value !== undefined && (!finite(value) || value < 0)))
		throw new Error('工艺间距必须为非负毫米值');
	const unresolved = [];
	if (!label(rules.source) || thresholds.some(value => value === undefined))
		unresolved.push({ check: 'rules', reason: '本次工艺阈值或其来源未齐' });
	const outer = input.board?.outline ? readRing(input.board.outline, '板框') : null;
	const slots = (input.board?.cutouts ?? []).map((slot, index) => readRing(slot, `锣槽 ${index + 1}`));
	if (!outer || !Array.isArray(input.board?.cutouts))
		unresolved.push({ check: 'board', reason: '缺实际外框或未确认锣槽清单' });
	const components = new Map();
	for (const item of input.components) {
		if (!label(item.ref) || components.has(item.ref) || !['top', 'bottom'].includes(item.side)
			|| ![item.xMm, item.yMm, item.rotationDeg].every(finite) || !['smt', 'manual', 'omit'].includes(item.assembly))
			throw new Error(`器件位号重复或位置、角度、装配方式不完整 ${item.ref}`);
		components.set(item.ref, item);
	}
	const moved = new Set();
	for (const move of input.moves ?? []) {
		if (!components.has(move.ref) || moved.has(move.ref) || ![move.xMm, move.yMm, move.rotationDeg].every(finite)
			|| (move.side !== undefined && !['top', 'bottom'].includes(move.side)))
			throw new Error(`候选位置无效、重复或位号不在当前板上 ${move.ref}`);
		const original = components.get(move.ref);
		components.set(move.ref, { ...original, xMm: move.xMm, yMm: move.yMm, rotationDeg: move.rotationDeg, side: move.side ?? original.side });
		moved.add(move.ref);
	}
	const installed = [...components.values()].filter(item => item.assembly !== 'omit');
	const bodies = [];
	for (const item of installed) {
		const body = item.body;
		if (!body || !label(body.source) || !label(item.partNumber) || body.partNumber !== item.partNumber
			|| ![body.widthMm, body.heightMm].every(v => finite(v) && v > 0)
			|| ![body.offsetXMm ?? 0, body.offsetYMm ?? 0, body.rotationOffsetDeg ?? 0].every(finite)) {
			unresolved.push({ check: 'body', ref: item.ref, reason: '缺可与实配料号核对的本体尺寸和来源' });
			continue;
		}
		bodies.push({ ...item, polygon: bodyPolygon(item) });
	}
	const findings = [];
	const add = (check, refs, distanceMm, requiredMm, overlap, boundary) => {
		if (overlap || (requiredMm !== undefined && distanceMm + EPS < requiredMm))
			findings.push({ check, refs, distanceMm, requiredMm: requiredMm ?? null, ...(boundary === undefined ? {} : { boundary }) });
	};
	for (const [i, a] of bodies.entries()) {
		if (!moved.size || moved.has(a.ref)) {
			if (outer) {
				const distance = boundaryGap(a.polygon, outer);
				const outside = !a.polygon.every(point => contains(outer, point));
				add('board-edge', [a.ref], outside ? 0 : distance, thresholds[1], outside || distance <= EPS);
			}
			for (const [index, ring] of slots.entries()) {
				const distance = boundaryGap(a.polygon, ring);
				const overlap = distance <= EPS || contains(ring, a.polygon[0]) || contains(a.polygon, ring[0]);
				add('routed-cutout', [a.ref], overlap ? 0 : distance, thresholds[2], overlap, index + 1);
			}
		}
		for (const b of bodies.slice(i + 1)) {
			if (a.side !== b.side || (moved.size && !moved.has(a.ref) && !moved.has(b.ref))) continue;
			const distance = boundaryGap(a.polygon, b.polygon);
			const overlap = distance <= EPS || contains(a.polygon, b.polygon[0]) || contains(b.polygon, a.polygon[0]);
			add('body-gap', [a.ref, b.ref], overlap ? 0 : distance, thresholds[0], overlap);
		}
	}
	return {
		status: findings.length ? 'fail' : unresolved.length ? 'incomplete' : 'pass',
		scope: 'placement-body-and-board-geometry', revision: input.revision, unit: 'mm', readOnly: true,
		checked: { installed: installed.length, models: bodies.length, moved: [...moved] },
		rules, findings, unresolved,
		notCovered: ['实际阻焊开窗', '钻孔与锡膏或随单钢网', '贴装工具实体', '成品制造验收'],
	};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		if (!process.argv[2]) throw new Error('用法：node check-pcb-placement.mjs placement.json');
		const input = JSON.parse((await readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, ''));
		const report = checkPlacementDfm(input);
		console.log(JSON.stringify(report, null, 2));
		process.exitCode = { pass: 0, fail: 1, incomplete: 2 }[report.status];
	}
	catch (error) {
		console.error(error.message);
		process.exitCode = 3;
	}
}
