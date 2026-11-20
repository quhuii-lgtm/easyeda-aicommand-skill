import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = process.argv[2] ?? fileURLToPath(new URL('../ai-command-engine/scripts/check-schematic.mjs', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'ace-schematic-audit-'));
const designPath = join(temp, 'design.json');
const snapshotPath = join(temp, 'snapshot.json');

const design = {
	page: 'fixture-page',
	regions: [{ id: 'power', title: 'Power' }, { id: 'control', title: 'Control' }],
	components: [{ ref: 'U1', region: 'power', attributes: { part: 'fixture' } }],
	pins: [{ pin: 'U1.1', net: 'GND', nc: false }, { pin: 'U1.2', net: null, nc: true }],
	directGroups: [{ id: 'ground', endpoints: ['U1.1', 'C1.2'] }],
	branches: [
		{ id: 'capacitor', kind: 'decoupling', connections: [{ net: 'GND', pins: ['U1.1', 'C1.2'] }] },
		{ id: 'local-branch', kind: 'branch', connections: [{ net: 'GND', pins: ['U1.1', 'U1.3'] }] },
	],
};
const snapshot = {
	page: design.page,
	regions: [{ ...design.regions[0], bounds: [0, 0, 100, 100], titleAnchor: [10, 90] },
		{ ...design.regions[1], bounds: [120, 0, 200, 100], titleAnchor: [130, 90] }],
	components: [{ ref: 'U1', bounds: [20, 20, 30, 30], attributes: { part: 'fixture' } }],
	pins: structuredClone(design.pins),
	wiringPins: [
		{ pin: 'U1.1', ref: 'U1', region: 'power', net: 'GND', x: 10, y: 10, side: 'left', island: 'a', label: true },
		{ pin: 'U1.3', ref: 'U1', region: 'power', net: 'GND', x: 10, y: 20, side: 'left', island: 'b', label: true },
		{ pin: 'C1.2', ref: 'C1', region: 'power', net: 'GND', x: 20, y: 20, side: 'right', island: 'a', label: true },
	],
	wirePaths: [{ id: 'fold', net: 'GND', pins: { a: ['U1.1'], b: ['C1.2'] },
		segments: [{ a: 'a', b: 'corner', length: 20 }, { a: 'corner', b: 'b', length: 20 }] }],
	grid: 1,
	nodes: ['U1.1', 'C1.2', 'branch', 'label'].map(id => ({ id })),
	segments: [{ a: 'U1.1', b: 'branch', length: 15 },
		{ a: 'C1.2', b: 'branch', length: 15 }, { a: 'label', b: 'branch', length: 25 }],
};

function run(edit, code, stage, designOverrides = {}) {
	const sample = structuredClone(snapshot);
	edit(sample);
	const result = audit({ ...design, stage, ...designOverrides }, sample, code);
	return code === 2 ? result : result.checks;
}

function audit(plan, readback, code) {
	writeFileSync(designPath, JSON.stringify(plan));
	writeFileSync(snapshotPath, JSON.stringify(readback));
	const result = spawnSync(process.execPath, [script, designPath, snapshotPath], { encoding: 'utf8' });
	assert.equal(result.status, code, result.stderr || result.stdout);
	return code === 2 ? result.stderr : JSON.parse(result.stdout);
}

try {
	const alignment = [{ id: 'column', axis: 'x', refs: ['U1', 'C1'] }];
	const aligned = run(s => {
		s.components[0].anchor = [20, 20];
		s.components.push({ ...s.components[0], ref: 'C1', anchor: [20, 40] });
	}, 0, 'placement', { alignments: alignment, components: [...design.components, { ...design.components[0], ref: 'C1' }] });
	assert.equal(aligned.find(c => c.item === 'component-alignment').status, 'pass');
	const noAnchor = run(() => {}, 3, 'placement', { alignments: alignment });
	assert.equal(noAnchor.find(c => c.item === 'component-alignment').status, 'incomplete');
	const offColumn = run(s => {
		s.components[0].anchor = [20, 20];
		s.components.push({ ...s.components[0], ref: 'C1', anchor: [25, 40] });
	}, 1, 'placement', { alignments: alignment, components: [...design.components, { ...design.components[0], ref: 'C1' }] });
	assert.equal(offColumn.find(c => c.item === 'component-alignment').status, 'fail');
	const tooWide = run(() => {}, 1, 'regions', { regions: [{ ...design.regions[0], maxWidth: 99 }, design.regions[1]] });
	assert.equal(tooWide.find(c => c.item === 'area-size').status, 'fail');
	const tooLong = run(() => {}, 1, 'wiring', { directGroups: [{ ...design.directGroups[0], maxLength: 29 }] });
	assert.equal(tooLong.find(c => c.item === 'wire-length-target').status, 'fail');
	const raisedLimit = run(s => { s.segments[2].length = 26; }, 1, 'wiring', { maxDirectGrids: 80 });
	assert.equal(raisedLimit.find(c => c.item === 'wire-limit-policy').status, 'fail');
	assert.equal(raisedLimit.find(c => c.item === 'direct-length').evidence.limit, 40);
	const straightDesign = { directGroups: [{ ...design.directGroups[0], requireStraight: true }] };
	const straight = run(s => {
		Object.assign(s.nodes[0], { x: 0, y: 0 });
		Object.assign(s.nodes[1], { x: 30, y: 0 });
	}, 3, 'wiring', straightDesign);
	assert.equal(straight.find(c => c.item === 'straight-wire').status, 'pass');
	const bent = run(s => {
		Object.assign(s.nodes[0], { x: 0, y: 0 });
		Object.assign(s.nodes[1], { x: 20, y: 0 });
	}, 1, 'wiring', straightDesign);
	assert.equal(bent.find(c => c.item === 'straight-wire').status, 'fail');
	const scoped = run(s => { delete s.pins; delete s.components; }, 0, 'regions');
	assert.deepEqual([...new Set(scoped.map(c => c.item))], ['functional-area', 'area-title-anchor', 'area-overlap']);
	const scopedMissing = run(s => { delete s.regions[0].titleAnchor; }, 3, 'regions');
	assert.ok(scopedMissing.some(c => c.item === 'area-title-anchor' && c.status === 'incomplete'));
	let checks = run(() => {}, 3);
	const finding = checks.find(c => c.status === 'candidate');
	const reviewed = run(s => {
		s.candidateReviews = [{ key: finding.candidateKey, status: 'retained', reason: 'Fixture clearance', evidence: 'fixture.png' }];
	}, 3);
	assert.equal(reviewed.find(c => c.candidateKey === finding.candidateKey).review.status, 'retained');
	const deletion = { deletedTextIds: ['old-text'] };
	const revived = run(s => {
		s.pageId = 'p1';
		s.reopenedTexts = { pageId: 'p1', ids: ['old-text'], evidence: 'reopened.json' };
	}, 1, 'sheet', deletion);
	assert.equal(revived.find(c => c.item === 'text-delete-persistence').status, 'fail');
	const deleted = run(s => {
		s.pageId = 'p1';
		s.reopenedTexts = { pageId: 'p1', ids: [], evidence: 'reopened.json' };
	}, 3, 'sheet', deletion);
	assert.equal(deleted.find(c => c.item === 'text-delete-persistence').status, 'pass');
	assert.equal(checks.find(c => c.item === 'area-title-anchor').status, 'pass');
	const outsideTitle = run(s => { s.regions[0].titleAnchor = [110, 90]; }, 1);
	assert.equal(outsideTitle.find(c => c.item === 'area-title-anchor' && c.scope === 'power').status, 'fail');
	const missingTitleAnchor = run(s => { delete s.regions[0].titleAnchor; }, 3);
	assert.equal(missingTitleAnchor.find(c => c.item === 'area-title-anchor' && c.scope === 'power').status, 'incomplete');
	assert.equal(checks.find(c => c.item === 'direct-length').evidence.grids, 40);
	assert.deepEqual(checks.find(c => c.item === 'adjacent-same-net-labels').evidence.pins.map(p => p.pin), ['U1.1', 'U1.3']);
	assert.deepEqual(checks.filter(c => c.item === 'branch-wiring').map(c => c.evidence.mode), ['direct', 'label']);
	assert.deepEqual(checks.find(c => c.item === 'same-region-labels').evidence.pins, ['U1.3', 'C1.2']);
	assert.ok(!checks.some(c => c.item === 'long-wire'));
	const long = run(s => { s.wirePaths[0].segments[1].length = 21; }, 1);
	assert.equal(long.find(c => c.item === 'long-wire').evidence.length, 41);
	const unknownGrid = run(s => { delete s.grid; s.wirePaths[0].segments[1].length = 81; }, 3);
	assert.equal(unknownGrid.find(c => c.item === 'long-wire').status, 'candidate');
	const separateRegions = run(s => { s.wiringPins[2].region = 'control'; }, 3);
	assert.ok(!separateRegions.some(c => c.item === 'same-region-labels'));
	assert.ok(checks.filter(c => c.status === 'incomplete').every(c =>
		['wire-bends', 'drawing-style', 'erc-drc-and-structure', 'visual-and-persistence'].includes(c.item)));

	checks = run(s => {
		s.regions[0].title = '';
		s.regions[1].bounds[0] = 90;
		s.components[0].bounds = [105, 10, 115, 20];
		s.pins[0].net = '+5V';
		s.pins[1].nc = false;
		s.segments[2].length = 26;
	}, 1);
	assert.equal(checks.filter(c => c.status === 'fail').length, 6);
	assert.equal(checks.find(c => c.item === 'direct-length').evidence.grids, 41);

	checks = run(s => { s.segments.splice(1, 1); }, 1);
	assert.equal(checks.find(c => c.item === 'direct-wire').status, 'fail');

	checks = run(s => { delete s.grid; delete s.pins[1].nc; delete s.components[0].attributes; }, 3);
	for (const item of ['component', 'pin-net', 'direct-length']) {
		assert.ok(checks.some(c => c.item === item && c.status === 'incomplete'));
	}

	assert.match(run(s => { s.page = 'wrong-page'; }, 2), /same page/);
	assert.match(run(s => { s.pins.push(s.pins[0]); }, 2), /duplicate pin/);
	checks = run(s => { s.wiringPins[1].island = 'a'; }, 3);
	assert.ok(!checks.some(c => c.item === 'adjacent-same-net-labels'));
	checks = run(s => { delete s.wiringPins[1].island; }, 3);
	assert.ok(checks.some(c => c.item === 'branch-wiring' && c.scope === 'local-branch' && c.status === 'incomplete'));
	assert.ok(checks.some(c => c.item === 'adjacent-same-net-scan' && c.status === 'incomplete'));
	checks = run(s => { s.wiringPins[1].net = '3V3'; }, 1);
	assert.ok(checks.some(c => c.item === 'branch-wiring' && c.status === 'fail'));
	const pages = ['p1', 'p2'].map(id => ({
		id, paper: 'A4', bounds: [0, 0, 300, 200], reserved: [[0, 150, 300, 200]],
	}));
	const layoutPlan = { currentPageId: 'p1', pages, blocks: snapshot.regions.map(r => ({
		id: r.id, pageId: 'p1', bounds: r.bounds,
	})) };
	const identify = s => { s.pageId = 'p1'; s.pageFrame = { paper: 'A4', bounds: [0, 0, 300, 200] }; };
	run(identify, 0, 'planning', { layoutPlan });
	const overflow = structuredClone(layoutPlan);
	overflow.blocks[1].bounds = [120, 0, 310, 100];
	assert.equal(run(identify, 1, 'planning', { layoutPlan: overflow }).find(c => c.scope === 'control').status, 'fail');
	const reserved = structuredClone(layoutPlan);
	reserved.blocks[1].bounds = [120, 0, 200, 160];
	run(identify, 1, 'planning', { layoutPlan: reserved });
	const split = structuredClone(layoutPlan);
	split.blocks[1].pageId = 'p2';
	run(identify, 0, 'planning', { layoutPlan: split, regions: [design.regions[0]] });
	const nets = [{ net: 'GND', pins: ['U1.1', 'C1.2'] }];
	const crossPage = { pageIds: ['p1', 'p2'], nets };
	const withReadbacks = s => {
		identify(s);
		s.blockReviews = layoutPlan.blocks.map(b => ({ id: b.id, status: 'pass', evidence: 'review.json' }));
		s.sheetReview = { status: 'pass', evidence: 'sheet.json' };
		s.reopenedPages = crossPage.pageIds.map(id => ({ id, evidence: id + '.json', nets: structuredClone(nets) }));
	};
	const scope = { layoutPlan, crossPage };
	const good = run(withReadbacks, 3, 'sheet', scope);
	assert.equal(good.filter(c => c.item === 'reopened-net-members' && c.status === 'pass').length, 2);
	assert.equal(good.filter(c => c.item === 'block-self-review' && c.status === 'pass').length, 2);
	assert.equal(good.find(c => c.item === 'sheet-review').status, 'pass');
	const missingPage = run(s => { withReadbacks(s); s.reopenedPages.pop(); }, 3, 'sheet', scope);
	assert.equal(missingPage.find(c => c.item === 'reopened-net-members' && c.scope === 'p2').status, 'incomplete');
	const changed = run(s => { withReadbacks(s); s.reopenedPages[1].nets[0].pins.push('U2.1'); }, 1, 'sheet', scope);
	assert.equal(changed.find(c => c.item === 'reopened-net-members' && c.scope === 'p2').status, 'fail');
	const missingReview = run(s => { withReadbacks(s); s.blockReviews.pop(); }, 3, 'sheet', scope);
	assert.equal(missingReview.find(c => c.item === 'block-self-review' && c.scope === 'control').status, 'incomplete');

	const caps = ['C1', 'C2', 'C3', 'C4'];
	const rails = ['3V3', 'GND'];
	const components = caps.map(ref => ({ ref, region: 'caps', attributes: { value: '100n' } }));
	const pins = rails.flatMap((net, i) => caps.map(ref => ({ pin: `${ref}.${i + 1}`, net, nc: false })));
	const groups = rails.map(net => ({ id: net, endpoints: pins.filter(pin => pin.net === net).map(pin => pin.pin) }));
	const staged = {
		page: 'bypass capacitors', pageId: 'bypass', requiredRegionReviews: ['caps'], auditRegion: 'caps', stage: 'wiring',
		regions: [{ id: 'caps', title: 'Bypass capacitors' }], components, pins, directGroups: groups,
		branches: [{ id: 'rail', kind: 'decoupling', connections: groups.map(g => ({ net: g.id, pins: g.endpoints })) }],
	};
	const readback = {
		page: staged.page, pageId: staged.pageId, coverage: { regions: true, wires: true },
		regions: [{ ...staged.regions[0], frameIds: ['frame'], titleId: 'title', bounds: [0, 0, 100, 100], titleAnchor: [10, 90] }],
		components: components.map((c, i) => ({ ref: c.ref, attributes: c.attributes, bounds: [10 + i * 5, 20, 14 + i * 5, 25] })),
		pins, grid: 1,
		wiringPins: pins.map(({ pin, net }, i) => ({ pin, ref: pin.split('.')[0], net, x: 10 + (i % 4) * 5,
			y: i < 4 ? 30 : 20, side: i < 4 ? 'up' : 'down', region: 'caps', island: net, label: false })),
		wirePaths: [],
		drawingReview: { status: 'pass', evidence: 'area.png' },
	};
	readback.nodes = readback.wiringPins.map(({ pin, x, y }) => ({ id: pin, x, y }));
	readback.segments = groups.flatMap(g => g.endpoints.slice(1).map((pin, i) => ({ a: g.endpoints[i], b: pin, length: 5 })));
	const noFrame = audit({ ...staged, stage: 'regions' }, { ...readback, regions: [{ ...readback.regions[0], frameIds: [] }] }, 1);
	assert.equal(noFrame.checks.find(c => c.item === 'functional-area').status, 'fail');
	const unreadFrame = audit({ ...staged, stage: 'regions' }, { ...readback, coverage: { regions: false }, regions: [] }, 3);
	assert.equal(unreadFrame.checks.find(c => c.item === 'functional-area').status, 'incomplete');
	const labeled = structuredClone(readback);
	labeled.segments = labeled.wiringPins.map(p => {
		Object.assign(p, { island: p.pin, label: true });
		labeled.nodes.push({ id: `label:${p.pin}`, x: p.x, y: p.y + 2 });
		return { a: p.pin, b: `label:${p.pin}`, length: 2 };
	});
	const labelReport = audit(staged, labeled, 1);
	assert.equal(labelReport.checks.filter(c => c.item === 'direct-wire' && c.status === 'fail').length, 2);
	assert.ok(labelReport.checks.filter(c => c.item === 'pin-net').every(c => c.status === 'pass'));
	const unreadWire = audit(staged, { ...labeled, coverage: { regions: true, wires: false } }, 3);
	assert.equal(unreadWire.checks.find(c => c.item === 'direct-wire').status, 'incomplete');
	const omitted = audit({ ...staged, directGroups: [] }, readback, 3);
	assert.equal(omitted.checks.find(c => c.item === 'direct-plan').status, 'incomplete');
	const noDirect = { ...staged, directGroups: [], regions: [{ ...staged.regions[0], noDirectReason: 'Fixture without required direct groups' }] };
	assert.equal(audit(noDirect, readback, 0).checks.find(c => c.item === 'direct-plan').status, 'pass');
	const areaReport = audit(staged, readback, 0).regionReport;
	const { auditRegion, ...sheetPlan } = { ...staged, stage: 'sheet' };
	const sheet = {
		...readback, regionReadbacks: [{ id: auditRegion, readback }],
		hostReview: { status: 'pass', evidence: 'DRC.json' }, persistenceReview: { status: 'pass', evidence: 'reopened.json' },
	};
	const missing = audit(sheetPlan, sheet, 3);
	assert.equal(missing.checks.find(c => c.item === 'region-report').status, 'incomplete');
	sheet.regionReports = [areaReport];
	assert.equal(audit(sheetPlan, sheet, 0).checks.find(c => c.item === 'region-report').status, 'pass');
	const paper = { id: staged.pageId, paper: 'A4', bounds: [0, 0, 300, 200], reserved: [[0, 150, 300, 200]] };
	audit({ ...sheetPlan, layoutPlan: { currentPageId: staged.pageId, pages: [paper],
		blocks: [{ id: auditRegion, pageId: staged.pageId, bounds: readback.regions[0].bounds }] } },
	{ ...sheet, pageFrame: { paper: paper.paper, bounds: paper.bounds } }, 0);
	const changedSheet = structuredClone(sheet);
	changedSheet.regionReadbacks[0].readback.nodes[0].x++;
	assert.equal(audit(sheetPlan, changedSheet, 3).checks.find(c => c.item === 'region-report').status, 'incomplete');
	const changedPlan = structuredClone(sheetPlan);
	changedPlan.maxAdjacentGap = 19;
	assert.equal(audit(changedPlan, sheet, 3).checks.find(c => c.item === 'region-report').status, 'incomplete');
	assert.equal(audit(sheetPlan, { ...sheet, regionReports: [{ ...areaReport, status: 'fail' }] }, 1)
		.checks.find(c => c.item === 'region-report').status, 'fail');
	const staleArea = structuredClone(sheet);
	staleArea.components[0].bounds[0]++;
	assert.equal(audit(sheetPlan, staleArea, 3).checks.find(c => c.item === 'region-report').status, 'incomplete');

	const other = { id: 'control', title: 'Control', noDirectReason: 'This area only has an isolated test point' };
	const otherComponent = { ref: 'TP1', region: other.id, attributes: { value: 'Test point' } };
	const otherPin = { pin: 'TP1.1', net: null, nc: true };
	const otherReadback = {
		page: staged.page, pageId: staged.pageId, coverage: readback.coverage, grid: 1,
		regions: [{ ...other, frameIds: ['frame-control'], titleId: 'title-control', bounds: [110, 0, 180, 100], titleAnchor: [115, 90] }],
		components: [{ ref: otherComponent.ref, attributes: otherComponent.attributes, bounds: [120, 20, 125, 25] }],
		pins: [otherPin], nodes: [{ id: otherPin.pin, x: 125, y: 20 }], segments: [], wirePaths: [],
		wiringPins: [{ ...otherPin, ref: otherComponent.ref, x: 125, y: 20, side: 'right', region: other.id }],
		drawingReview: { status: 'pass', evidence: 'control.png' },
	};
	const twoRegions = {
		...sheetPlan, requiredRegionReviews: ['caps', other.id], regions: [...sheetPlan.regions, other],
		components: [...sheetPlan.components, otherComponent], pins: [...sheetPlan.pins, otherPin],
	};
	const otherReport = audit({ ...twoRegions, stage: 'wiring', auditRegion: other.id }, otherReadback, 0).regionReport;
	const linkedSheet = {
		...sheet, regionReadbacks: [...sheet.regionReadbacks, { id: other.id, readback: otherReadback }],
		...Object.fromEntries(['regions', 'components', 'pins', 'wiringPins', 'nodes'].map(key => [key, [...sheet[key], ...otherReadback[key]]])),
	};
	assert.equal(audit(twoRegions, linkedSheet, 3).checks.find(c => c.item === 'region-report' && c.scope === other.id).status, 'incomplete');
	assert.match(audit({ ...twoRegions, requiredRegionReviews: ['caps'] }, linkedSheet, 2), /every planned/);
	assert.equal(audit(twoRegions, { ...linkedSheet, regionReports: [areaReport, otherReport] }, 0).checks
		.filter(c => c.item === 'region-report' && c.status === 'pass').length, 2);
	const existingSheet = { ...twoRegions, requiredRegionReviews: ['caps'], regions: [twoRegions.regions[0], { ...other, unchanged: true }] };
	assert.equal(audit(existingSheet, linkedSheet, 0).checks.filter(c => c.item === 'region-report').length, 1);
	console.log('PASS schematic audit: legacy checks, missing frame, four capacitors with label-only stubs, missing/stale region report, staged delivery');
} finally {
	rmSync(designPath, { force: true });
	rmSync(snapshotPath, { force: true });
	rmdirSync(temp);
}

