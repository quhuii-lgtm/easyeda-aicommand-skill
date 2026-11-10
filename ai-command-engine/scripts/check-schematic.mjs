import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [designPath, snapshotPath, approvalPath] = process.argv.slice(2);
if (!designPath || !snapshotPath) {
	console.error('Usage: node check-schematic.mjs <design.json> <snapshot.json> [approved-wire-exceptions.json]');
	process.exit(2);
}

const checks = [];
function report(item, scope, status, evidence, outstanding = '') {
	checks.push({ item, scope, status, evidence, outstanding });
}

function reviewCandidates(snapshot) {
	const reviews = index(snapshot.candidateReviews, 'key', 'snapshot.candidateReviews');
	for (const review of reviews?.values() ?? []) {
		if (!['retained', 'fixed'].includes(review.status) || !hasText(review.reason) || !hasText(review.evidence)) {
			throw new Error('Candidate reviews require a retained/fixed status, reason and evidence reference');
		}
	}
	const summary = { pending: [], retained: [], stillPresent: [], recordedFixed: [], unmatched: [] };
	for (const check of checks.filter(check => check.status === 'candidate')) {
		const key = createHash('sha256').update(JSON.stringify([check.item, check.scope, check.evidence])).digest('hex');
		check.candidateKey = key;
		const review = reviews?.get(key);
		if (review) check.review = review;
		if (review?.status === 'retained') summary.retained.push(key);
		else if (review?.status === 'fixed') summary.stillPresent.push(key);
		else summary.pending.push(key);
		reviews?.delete(key);
	}
	for (const [key, review] of reviews ?? []) {
		summary[review.status === 'fixed' ? 'recordedFixed' : 'unmatched'].push(review);
		if (review.status === 'retained') report('candidate-review', key, 'incomplete', review,
			'Retained review no longer matches a current finding');
	}
	return summary;
}

function hasText(value) {
	return typeof value === 'string' && Boolean(value.trim());
}

function checkDeletedTexts(design, snapshot) {
	const expected = design.deletedTextIds;
	if (expected === undefined) return;
	const validIds = ids => Array.isArray(ids) && ids.every(hasText) && new Set(ids).size === ids.length;
	if (!validIds(expected)) throw new Error('Invalid design.deletedTextIds');
	if (!expected.length) return;
	const read = snapshot.reopenedTexts;
	if (read?.pageId !== snapshot.pageId || !hasText(read?.pageId)
		|| !hasText(read.evidence) || !validIds(read.ids)) {
		report('text-delete-persistence', 'page', 'incomplete', '', 'Complete reopened TEXT IDs and page evidence are required');
		return;
	}
	const returned = expected.filter(id => read.ids.includes(id));
	report('text-delete-persistence', read.pageId, returned.length ? 'fail' : 'pass',
		{ expectedAbsent: expected, presentAfterReopen: returned, evidence: read.evidence });
}

function checkSubstitutions(design, snapshot) {
	const expected = index(design.substitutions, 'ref', 'design.substitutions');
	const actual = index(snapshot.substitutions, 'ref', 'snapshot.substitutions');
	if (!expected?.size && !actual?.size) return;
	const designPins = index(design.pins, 'pin', 'design.pins');
	const actualPins = index(snapshot.pins, 'pin', 'snapshot.pins');
	compare('substitution', expected, actual, (ref, want, got) => {
		const original = index(want.pins, 'pin', 'substitution original pins');
		const saved = index(got.pins, 'pin', 'substitution saved pins');
		const expectedIds = [...(designPins?.keys() ?? [])].filter(pin => pin.startsWith(`${ref}.`));
		if (!hasText(want.footprint) || !hasText(got.footprint) || !hasText(want.evidence) || !hasText(got.evidence)
			|| !expectedIds.length || !original?.size || !saved?.size) {
			report('substitution', ref, 'incomplete', '', 'Original and saved footprint, full pin mapping and evidence are required');
			return;
		}
		const evidence = { original: want.evidence, saved: got.evidence, expectedFootprint: want.footprint, actualFootprint: got.footprint };
		report('substitution', ref, want.footprint === got.footprint ? 'pass' : 'fail', evidence);
		for (const pin of expectedIds) {
			const a = original.get(pin), b = saved.get(pin);
			const planned = designPins.get(pin), read = actualPins?.get(pin);
			const validPads = pads => Array.isArray(pads) && pads.length > 0
				&& pads.every(hasText) && new Set(pads).size === pads.length;
			if (!validPads(a?.pads) || !validPads(b?.pads) || !read || typeof planned.nc !== 'boolean'
				|| typeof read.nc !== 'boolean' || !Object.hasOwn(planned, 'net') || !Object.hasOwn(read, 'net')) {
				report('substitution-pin', pin, 'incomplete', '', 'Pin mapping or net/NC readback is missing');
				continue;
			}
			const matches = JSON.stringify([...a.pads].sort()) === JSON.stringify([...b.pads].sort())
				&& planned.net === read.net && planned.nc === read.nc && !(read.nc && read.net !== null);
			report('substitution-pin', pin, matches ? 'pass' : 'fail',
				{ expectedPads: a.pads, actualPads: b.pads, expectedNet: planned.net, actualNet: read.net,
					expectedNc: planned.nc, actualNc: read.nc });
		}
		for (const pin of new Set([...original.keys(), ...saved.keys()])) {
			if (!expectedIds.includes(pin)) report('substitution-pin', pin, 'fail', 'Pin not listed for this device in design');
		}
		if (!['unchanged', 'changed'].includes(got.display) || !hasText(got.displayEvidence)) {
			report('substitution-display', ref, 'incomplete', '', 'Saved drawing display review is missing');
		} else {
			report('substitution-display', ref, got.display === 'changed' ? 'candidate' : 'pass',
				{ display: got.display, evidence: got.displayEvidence }, got.display === 'changed' ? 'Review the saved drawing' : '');
		}
	});
}

function index(records, key, label) {
	if (records === undefined) return null;
	if (!Array.isArray(records)) throw new Error(`${label} must be an array`);
	const result = new Map();
	for (const record of records) {
		const id = record?.[key];
		if (typeof id !== 'string' || !id.trim() || result.has(id)) {
			throw new Error(`${label}: missing or duplicate ${key} (${id})`);
		}
		result.set(id, record);
	}
	return result;
}

function compare(item, expected, actual, verify) {
	if (!expected?.size || !actual) {
		report(item, 'page', 'incomplete', '', 'Expected records or actual readback are missing');
		return;
	}
	for (const [id, want] of expected) {
		const got = actual.get(id);
		if (!got) report(item, id, 'fail', 'Object absent from supplied readback');
		else verify(id, want, got);
	}
	for (const id of actual.keys()) {
		if (!expected.has(id)) report(item, id, 'fail', 'Object not listed in design');
	}
}

function validBox(box) {
	return Array.isArray(box) && box.length === 4 && box.every(Number.isFinite)
		&& box[0] < box[2] && box[1] < box[3];
}

function contained(inner, outer) {
	return inner[0] >= outer[0] && inner[1] >= outer[1]
		&& inner[2] <= outer[2] && inner[3] <= outer[3];
}

function overlaps(a, b) {
	return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

function checkSheetPlan(design, snapshot, stage) {
	const plan = design.layoutPlan;
	if (plan === undefined && stage !== 'planning') return;
	const pages = index(plan?.pages, 'id', 'layoutPlan.pages');
	const blocks = index(plan?.blocks, 'id', 'layoutPlan.blocks');
	if (!pages?.size || !blocks?.size || !pages.has(plan.currentPageId)) {
		report('a4-plan', 'page', 'incomplete', '', 'Supply the A4 pages, current page ID and complete functional blocks');
		return;
	}
	for (const [id, page] of pages) {
		if (!validBox(page.bounds) || !Array.isArray(page.reserved) || !page.reserved.length
			|| page.reserved.some(box => !validBox(box) || !contained(box, page.bounds))) {
			throw new Error(`Invalid A4 bounds or reserved space: ${id}`);
		}
		const paper = page.paper === 'A4';
		report('a4-page', id, paper ? 'pass' : 'fail', { paper: page.paper, bounds: page.bounds, reserved: page.reserved });
	}
	const pageId = snapshot.pageId;
	report('planned-page-identity', plan.currentPageId,
		nonempty(pageId) ? pageId === plan.currentPageId ? 'pass' : 'fail' : 'incomplete', { actual: pageId });
	const frame = snapshot.pageFrame;
	const expectedFrame = pages.get(plan.currentPageId);
	const frameStatus = !validBox(frame?.bounds) || !nonempty(frame?.paper) ? 'incomplete'
		: frame.paper === expectedFrame.paper && frame.bounds.every((value, i) => value === expectedFrame.bounds[i]) ? 'pass' : 'fail';
	report('actual-a4-frame', plan.currentPageId, frameStatus, { expected: expectedFrame.bounds, actual: frame });
	const planned = [...blocks.values()];
	for (const [i, block] of planned.entries()) {
		const page = pages.get(block.pageId);
		if (!page || !validBox(block.bounds)) throw new Error(`Invalid block assignment or bounds: ${block.id}`);
		const clashes = planned.slice(i + 1).filter(other => other.pageId === block.pageId
			&& validBox(other.bounds) && overlaps(block.bounds, other.bounds)).map(other => other.id);
		const fits = contained(block.bounds, page.bounds)
			&& !page.reserved.some(box => overlaps(box, block.bounds)) && !clashes.length;
		report('a4-block-fit', block.id, fits ? 'pass' : 'fail', { page: block.pageId, bounds: block.bounds, clashes },
			fits ? '' : 'Replan the layout or move a complete functional block to another page');
	}
	const current = planned.filter(block => block.pageId === plan.currentPageId);
	const required = index(design.regions, 'id', 'design.regions');
	if (!required?.size) {
		report('planned-blocks', plan.currentPageId, 'incomplete', '', 'Supply the confirmed functional block inventory');
	} else {
		const assigned = new Set(current.map(block => block.id));
		const missing = [...required.keys()].filter(id => !assigned.has(id));
		const extra = [...assigned].filter(id => !required.has(id));
		report('planned-blocks', plan.currentPageId, missing.length || extra.length ? 'fail' : 'pass', { missing, extra });
	}
	if (stage === 'planning') return;
	const actual = index(snapshot.regions, 'id', 'snapshot.regions');
	for (const block of current) {
		const bounds = actual?.get(block.id)?.bounds;
		const status = !validBox(bounds) ? 'incomplete' : contained(bounds, block.bounds) ? 'pass' : 'fail';
		report('actual-block-fit', block.id, status, { planned: block.bounds, actual: bounds });
	}
	if (stage !== 'sheet') return;
	const sheet = snapshot.sheetReview;
	const sheetStatus = sheet?.status === 'fail' ? 'fail'
		: sheet?.status === 'pass' && nonempty(sheet.evidence) ? 'pass' : 'incomplete';
	const reviews = index(snapshot.blockReviews, 'id', 'snapshot.blockReviews');
	for (const block of current) {
		const review = reviews?.get(block.id);
		const status = review?.status === 'fail' ? 'fail'
			: review?.status === 'pass' && nonempty(review.evidence) ? 'pass' : 'incomplete';
		report('block-self-review', block.id, status, review?.evidence,
			status === 'incomplete' ? 'Supply the block readback and local image review reference' : '');
	}
	report('sheet-review', plan.currentPageId, sheetStatus, sheet?.evidence,
		sheetStatus === 'incomplete' ? 'Supply the whole-page review reference' : '');
}

function nonempty(value) {
	return typeof value === 'string' && !!value.trim();
}

function netMembers(records, label) {
	const entries = index(records, 'net', label);
	if (!entries?.size) throw new Error(`Missing network members: ${label}`);
	const seen = new Set();
	for (const [net, record] of entries) {
		if (!Array.isArray(record.pins) || !record.pins.length) {
			throw new Error(`Missing pins in ${label}: ${net}`);
		}
		for (const pin of record.pins) {
			if (!nonempty(pin) || seen.has(pin)) throw new Error(`Invalid or duplicate pin in ${label}: ${net}`);
			seen.add(pin);
		}
		entries.set(net, [...record.pins].sort());
	}
	return entries;
}

function checkReopenedNets(design, snapshot) {
	const expected = design.crossPage;
	if (expected === undefined) {
		if (design.layoutPlan?.pages?.length > 1) {
			report('reopened-net-members', 'page', 'incomplete', '', 'Supply the confirmed cross-page network members');
		}
		return;
	}
	if (!Array.isArray(expected.pageIds) || expected.pageIds.length < 2
		|| expected.pageIds.some(id => !nonempty(id)) || new Set(expected.pageIds).size !== expected.pageIds.length) {
		throw new Error('crossPage.pageIds must contain distinct IDs for all pages in scope');
	}
	const current = design.layoutPlan?.currentPageId ?? snapshot.pageId;
	if (current && !expected.pageIds.includes(current)) {
		report('reopened-net-members', current, 'fail', 'Current page is missing from cross-page scope');
	}
	const want = netMembers(expected.nets, 'crossPage.nets');
	const reads = index(snapshot.reopenedPages, 'id', 'snapshot.reopenedPages');
	for (const id of expected.pageIds) {
		const page = reads?.get(id);
		if (!nonempty(page?.evidence) || page.nets === undefined) {
			report('reopened-net-members', id, 'incomplete', '', 'Supply a separate netlist read after save and reopen');
			continue;
		}
		let got;
		try {
			got = netMembers(page.nets, `reopened page ${id}`);
		} catch (error) {
			report('reopened-net-members', id, 'fail', error.message);
			continue;
		}
		const diff = [...new Set([...want.keys(), ...got.keys()])].filter(net =>
			JSON.stringify(want.get(net)) !== JSON.stringify(got.get(net))).map(net =>
			({ net, expected: want.get(net), actual: got.get(net) }));
		report('reopened-net-members', id, diff.length ? 'fail' : 'pass',
			{ evidence: page.evidence, expectedNets: want.size, actualNets: got.size, differences: diff });
	}
	for (const id of reads?.keys() ?? []) {
		if (!expected.pageIds.includes(id)) report('reopened-net-members', id, 'fail', 'Unexpected page ID');
	}
}


function checkAreaSize(id, want, bounds) {
	for (const [axis, limit, length] of [
		['width', want.maxWidth, bounds[2] - bounds[0]],
		['height', want.maxHeight, bounds[3] - bounds[1]],
	]) {
		if (limit === undefined) continue;
		if (!Number.isFinite(limit) || limit <= 0) throw new Error(`Invalid area ${axis} target: ${id}`);
		report('area-size', id, length <= limit ? 'pass' : 'fail', { axis, length, limit });
	}
}

function checkCompactness(id, want, got) {
	const before = want.baselineBounds;
	const area = box => (box[2] - box[0]) * (box[3] - box[1]);
	if (before !== undefined) {
		if (!validBox(before)) throw new Error(`Invalid baseline bounds: ${id}`);
		const previousArea = area(before);
		const currentArea = area(got.bounds);
		report('area-change', id, 'measured', { previousArea, currentArea,
			changePercent: (currentArea / previousArea - 1) * 100, unit: 'source-coordinate-squared' });
	}
	for (const { blocks, axis, maxGap } of want.blockGaps ?? []) {
		if (!Array.isArray(blocks) || blocks.length !== 2 || blocks[0] === blocks[1]
			|| blocks.some(block => typeof block !== 'string' || !block.trim())
			|| !['x', 'y'].includes(axis) || !Number.isFinite(maxGap) || maxGap < 0) {
			throw new Error(`Invalid block gap target: ${id}`);
		}
		const evidence = { blocks, axis, maxGap, unit: 'source-coordinate' };
		const [a, b] = blocks.map(block => Object.hasOwn(got.blockBounds ?? {}, block) ? got.blockBounds[block] : null);
		if (!validBox(a) || !validBox(b)) {
			report('block-gap', id, 'incomplete', evidence, 'Actual block bounds are missing');
			continue;
		}
		const i = axis === 'x' ? 0 : 1;
		const gap = Math.max(0, Math.max(a[i], b[i]) - Math.min(a[i + 2], b[i + 2]));
		report('block-gap', id, gap > maxGap ? 'candidate' : 'pass', { ...evidence, gap },
			gap > maxGap ? 'Review whether the gap can be reduced while preserving clearance and readability' : '');
	}
}

function checkRegions(design, snapshot) {
	const regions = index(snapshot.regions, 'id', 'snapshot.regions');
	compare('functional-area', index(design.regions, 'id', 'design.regions'), regions, (id, want, got) => {
		if (typeof want.title !== 'string' || !want.title.trim() || !validBox(got.bounds)) {
			report('functional-area', id, 'incomplete', '', 'Expected title or actual box geometry is missing');
		} else {
			checkAreaSize(id, want, got.bounds);
			checkCompactness(id, want, got);
			report('functional-area', id, got.title === want.title ? 'pass' : 'fail',
				{ expectedTitle: want.title, actualTitle: got.title ?? null, bounds: got.bounds });
			if (got.title === want.title) {
				const anchor = got.titleAnchor;
				if (!Array.isArray(anchor) || anchor.length !== 2 || !anchor.every(Number.isFinite)) {
					report('area-title-anchor', id, 'incomplete', { title: got.title }, 'Actual title anchor is missing');
				} else {
					const [x, y] = anchor;
					const [left, bottom, right, top] = got.bounds;
					const inside = x >= left && x <= right && y >= bottom && y <= top;
					report('area-title-anchor', id, inside ? 'pass' : 'fail',
						{ title: got.title, anchor, bounds: got.bounds },
						inside ? '' : 'Title anchor lies outside its assigned functional area');
				}
			}
		}
	});
	const valid = [...(regions?.values() ?? [])].filter(region => validBox(region.bounds));
	let overlapCount = 0;
	for (let i = 0; i < valid.length; i++) {
		for (const b of valid.slice(i + 1)) {
			const x = valid[i];
			if (Math.max(x.bounds[0], b.bounds[0]) < Math.min(x.bounds[2], b.bounds[2])
				&& Math.max(x.bounds[1], b.bounds[1]) < Math.min(x.bounds[3], b.bounds[3])) {
				overlapCount++;
				report('area-overlap', `${x.id} / ${b.id}`, 'fail', [x.bounds, b.bounds]);
			}
		}
	}
	if (!overlapCount) {
		const complete = regions?.size && valid.length === regions.size;
		report('area-overlap', 'page', complete ? 'pass' : 'incomplete', { measured: valid.length },
			complete ? '' : 'Complete functional-area geometry was not supplied');
	}
	return regions;
}

function checkComponents(design, snapshot, regions) {
	compare('component', index(design.components, 'ref', 'design.components'),
		index(snapshot.components, 'ref', 'snapshot.components'), (id, want, got) => {
			const attributes = Object.entries(want.attributes ?? {});
			const mismatched = attributes.filter(([k, v]) => Object.hasOwn(got.attributes ?? {}, k) && got.attributes[k] !== v);
			const missing = attributes.filter(([k]) => !Object.hasOwn(got.attributes ?? {}, k)).map(([k]) => k);
			const bounds = regions?.get(want.region)?.bounds;
			const geometryKnown = validBox(bounds) && validBox(got.bounds);
			const outside = geometryKnown && !contained(got.bounds, bounds);
			const status = mismatched.length || outside ? 'fail'
				: !attributes.length || missing.length || !geometryKnown ? 'incomplete' : 'pass';
			report('component', id, status, { region: want.region ?? null, mismatched, outside },
				status === 'incomplete' ? { missingAttributes: missing, geometryKnown } : '');
		});
}

function checkAlignment(design, snapshot) {
	const targets = index(design.alignments, 'id', 'design.alignments');
	if (!targets?.size) return;
	const components = index(snapshot.components, 'ref', 'snapshot.components');
	for (const [id, target] of targets) {
		const { axis, refs } = target;
		const tolerance = target.tolerance ?? 0;
		if (!['x', 'y'].includes(axis) || !Array.isArray(refs) || refs.length < 2
			|| new Set(refs).size !== refs.length || refs.some(ref => typeof ref !== 'string' || !ref.trim())
			|| !Number.isFinite(tolerance) || tolerance < 0) throw new Error(`Invalid alignment: ${id}`);
		const positions = refs.map(ref => {
			const anchor = components?.get(ref)?.anchor;
			return Array.isArray(anchor) && anchor.length === 2 && anchor.every(Number.isFinite)
				? anchor[axis === 'x' ? 0 : 1] : null;
		});
		const evidence = { axis, refs, positions, tolerance };
		if (positions.includes(null)) {
			report('component-alignment', id, 'incomplete', evidence, 'Actual component anchors are missing');
		} else {
			const spread = Math.max(...positions) - Math.min(...positions);
			report('component-alignment', id, spread <= tolerance ? 'pass' : 'fail', { ...evidence, spread });
		}
	}
}

function checkPins(design, snapshot) {
	const validNet = net => net === null || (typeof net === 'string' && Boolean(net.trim()));
	compare('pin-net', index(design.pins, 'pin', 'design.pins'),
		index(snapshot.pins, 'pin', 'snapshot.pins'), (id, want, got) => {
			if (!validNet(want.net) || typeof want.nc !== 'boolean'
				|| !validNet(got.net) || typeof got.nc !== 'boolean') {
				report('pin-net', id, 'incomplete', '', 'Both net and explicit NC state are required');
				return;
			}
			const same = want.net === got.net && want.nc === got.nc && !(got.nc && got.net !== null);
			report('pin-net', id, same ? 'pass' : 'fail', { expected: want, actual: got });
		});
}

function distances(graph, start, previous) {
	const result = new Map([[start, 0]]);
	const pending = new Set(graph.keys());
	while (pending.size) {
		let closest, best = Infinity;
		for (const id of pending) {
			const value = result.get(id) ?? Infinity;
			if (value < best) { best = value; closest = id; }
		}
		if (closest === undefined) break;
		pending.delete(closest);
		for (const [end, length] of graph.get(closest)) {
			if (best + length < (result.get(end) ?? Infinity)) {
				result.set(end, best + length);
				previous?.set(end, closest);
			}
		}
	}
	return result;
}

function pathBends(nodes, previous, end) {
	let bends = 0;
	let direction;
	for (let from; (from = previous.get(end)) !== undefined; end = from) {
		const a = nodes.get(from);
		const b = nodes.get(end);
		if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) return null;
		const dx = Math.abs(b.x - a.x) <= 1e-6 ? 0 : Math.sign(b.x - a.x);
		const dy = Math.abs(b.y - a.y) <= 1e-6 ? 0 : Math.sign(b.y - a.y);
		if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
		const next = dx || 2 * dy;
		if (direction !== undefined && direction !== next) bends++;
		direction = next;
	}
	return bends;
}

function wirePolicy(design) {
	const requested = design.maxDirectGrids ?? 40;
	if (!Number.isFinite(requested) || requested <= 0) throw new Error('Invalid maxDirectGrids');
	if (requested > 40) report('wire-limit-policy', 'page', 'fail', { requested, enforced: 40 },
		'Page-wide increases are forbidden. Supply an approved exception for an exact pin pair.');
	const limit = Math.min(requested, 40);
	const exceptions = new Map();
	const pairKey = (a, b) => JSON.stringify([a, b].sort());
	if (approvalPath) {
		const approvals = JSON.parse(readFileSync(approvalPath, 'utf8').replace(/^\uFEFF/, ''));
		if (approvals.page !== design.page || !Array.isArray(approvals.exceptions)) {
			throw new Error('Approval file must identify the audited page and list its exceptions');
		}
		for (const entry of approvals.exceptions) {
			const { endpoints, maxGrids, reason, approvedBy, approvalRef } = entry;
			if (!Array.isArray(endpoints) || endpoints.length !== 2 || endpoints[0] === endpoints[1]
				|| endpoints.some(pin => typeof pin !== 'string' || !/^.+\.[^.]+$/.test(pin))
				|| !Number.isFinite(maxGrids) || maxGrids <= limit
				|| [reason, approvedBy, approvalRef].some(value => typeof value !== 'string' || !value.trim())) {
				throw new Error('Each approved exception requires two distinct pin IDs, maxGrids, reason, approvedBy and approvalRef');
			}
			const key = pairKey(...endpoints);
			if (exceptions.has(key)) throw new Error('Duplicate wire exception');
			exceptions.set(key, entry);
			report('wire-exception', endpoints.join(' / '), 'measured', entry);
		}
	}
	return (a, b) => exceptions.get(pairKey(a, b))?.maxGrids ?? limit;
}

function checkWires(design, snapshot, limitFor) {
	const groups = index(design.directGroups, 'id', 'design.directGroups');
	if (!groups) {
		report('direct-wire', 'page', 'incomplete', '', 'Expected direct-connection groups are missing');
		return;
	}
	if (!groups.size) {
		report('direct-wire', 'page', 'not-applicable', 'Design declares no required direct groups');
		return;
	}
	const nodes = index(snapshot.nodes, 'id', 'snapshot.nodes');
	if (!nodes || !Array.isArray(snapshot.segments)) {
		report('direct-wire', 'page', 'incomplete', '', 'Physical wire graph is missing');
		return;
	}
	const graph = new Map([...nodes.keys()].map(id => [id, []]));
	for (const edge of snapshot.segments) {
		const { a, b, length } = edge;
		if (!graph.has(a) || !graph.has(b) || !Number.isFinite(length) || length <= 0) {
			throw new Error('snapshot.segments contains an invalid endpoint or length');
		}
		graph.get(a).push([b, length]);
		graph.get(b).push([a, length]);
	}
	const grid = snapshot.grid;
	for (const [id, group] of groups) {
		const endpoints = group.endpoints;
		if (!Array.isArray(endpoints) || new Set(endpoints).size < 2) throw new Error(`Invalid endpoints: ${id}`);
		if (endpoints.some(end => !graph.has(end))) {
			report('direct-wire', id, 'incomplete', endpoints, 'Required endpoint missing from wire graph');
			continue;
		}
		// Include branch and label ends, and measure the longest of the shortest paths.
		const previous = new Map();
		const reachable = distances(graph, endpoints[0], previous);
		if (endpoints.some(end => !reachable.has(end))) {
			report('direct-wire', id, 'fail', endpoints, 'Endpoints are not physically connected');
			continue;
		}
		const ends = [...new Set([...endpoints, ...[...reachable.keys()].filter(n =>
			nodes.get(n).terminal === true || graph.get(n).length === 1)])];
		let longest = 0, longestPair;
		const violations = [];
		for (const [i, start] of ends.entries()) {
			const paths = distances(graph, start);
			for (const end of ends.slice(i + 1)) {
				const length = paths.get(end);
				const limit = limitFor(start, end);
				if (length > longest) { longest = length; longestPair = [start, end]; }
				if (length / grid > limit) violations.push({ endpoints: [start, end], grids: length / grid, limit });
			}
		}
		report('direct-wire', id, 'pass', { endpoints, physicallyConnected: true });
		if (group.maxLength !== undefined) {
			if (endpoints.length !== 2 || !Number.isFinite(group.maxLength) || group.maxLength <= 0) {
				throw new Error(`Invalid two-endpoint length target: ${id}`);
			}
			const length = reachable.get(endpoints[1]);
			report('wire-length-target', id, length <= group.maxLength ? 'pass' : 'fail',
				{ endpoints, length, limit: group.maxLength, unit: 'source-coordinate' });
		}
		if (group.maxBends !== undefined && (endpoints.length !== 2
			|| !Number.isInteger(group.maxBends) || group.maxBends < 0)) throw new Error(`Invalid bend target: ${id}`);
		if (endpoints.length === 2) {
			const length = reachable.get(endpoints[1]);
			const bends = pathBends(nodes, previous, endpoints[1]);
			report('wire-bends', id, bends === null ? 'incomplete' : 'measured',
				{ endpoints, length, bends, unit: 'source-coordinate' },
				bends === null ? 'A shortest route lacks usable orthogonal coordinates' : '');
			if (bends !== null && group.maxBends !== undefined) {
				report('wire-bend-target', id, bends <= group.maxBends ? 'pass' : 'fail',
					{ endpoints, bends, limit: group.maxBends });
			}
			if (bends >= 3 && (group.maxBends === undefined || bends <= group.maxBends)) {
				report('wire-bend-review', id, 'candidate', { endpoints, length, bends },
					'Check whether pin alignment or component orientation can remove bends while preserving clearance');
			}
		}
		if (group.requireStraight === true) {
			if (endpoints.length !== 2) throw new Error(`Straight wire requires two endpoints: ${id}`);
			const [a, b] = endpoints.map(end => nodes.get(end));
			if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) {
				report('straight-wire', id, 'incomplete', { endpoints }, 'Endpoint coordinates are missing');
			} else {
				const length = reachable.get(endpoints[1]);
				const separation = Math.hypot(a.x - b.x, a.y - b.y);
				const aligned = a.x === b.x || a.y === b.y;
				const straight = aligned && separation > 0 && Math.abs(length - separation) <= 1e-6;
				report('straight-wire', id, straight ? 'pass' : 'fail',
					{ endpoints, aligned, length, separation }, straight ? '' : 'Endpoints are not joined by a straight orthogonal path');
			}
		}
		if (!Number.isFinite(grid) || grid <= 0) {
			report('direct-length', id, 'incomplete', { longest }, 'Grid size is unknown');
		} else {
			report('direct-length', id, violations.length ? 'fail' : 'pass',
				{ longest, grid, grids: longest / grid, limit: limitFor(...longestPair), violations });
		}
	}
}

function checkLabelWiring(design, snapshot) {
	// Island IDs describe physical connectivity. A shared net name alone must never create an island.
	// Each pin record carries its page coordinates, exit side, and verified label attachment.
	const pins = index(snapshot.wiringPins, 'pin', 'snapshot.wiringPins');
	if (!pins?.size) {
		report('label-wiring', 'page', 'incomplete', '', 'Physical pin and label readback is missing');
		return;
	}
	const groups = new Map();
	const unknown = [];
	for (const p of pins.values()) {
		if (!p.ref || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !['left', 'right', 'up', 'down'].includes(p.side)) {
			unknown.push(p.pin);
			continue;
		}
		const horizontal = p.side === 'left' || p.side === 'right';
		const key = JSON.stringify([p.ref, p.side, horizontal ? p.x : p.y]);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push({ ...p, along: horizontal ? p.y : p.x });
	}
	const gap = design.maxAdjacentGap ?? 20;
	if (!Number.isFinite(gap) || gap <= 0) throw new Error('Invalid maxAdjacentGap');
	let examined = 0;
	let candidates = 0;
	for (const group of groups.values()) {
		group.sort((a, b) => a.along - b.along);
		for (let i = 1; i < group.length; i++) {
			const [a, b] = [group[i - 1], group[i]];
			const spacing = b.along - a.along;
			if (spacing <= 0 || spacing > gap || !a.net || a.net !== b.net) continue;
			examined++;
			if (typeof a.island !== 'string' || typeof b.island !== 'string'
				|| typeof a.label !== 'boolean' || typeof b.label !== 'boolean') {
				unknown.push(a.pin, b.pin);
			} else if (a.island !== b.island && a.label && b.label) {
				candidates++;
				report('adjacent-same-net-labels', a.ref, 'candidate',
					{ net: a.net, spacing, pins: [a, b].map(p => ({ pin: p.pin, x: p.x, y: p.y, island: p.island })) },
					'Separate physical islands with labels; verify grid and clearance before judging direct routing');
			}
		}
	}
	report('adjacent-same-net-scan', 'page', unknown.length ? 'incomplete' : 'pass',
		{ examined, candidates, uncoveredPins: [...new Set(unknown)] });

	const byRegionAndNet = new Map();
	for (const pin of pins.values()) {
		if (!pin.region || !pin.ref || !pin.net || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) continue;
		const key = JSON.stringify([pin.region, pin.net]);
		if (!byRegionAndNet.has(key)) byRegionAndNet.set(key, []);
		byRegionAndNet.get(key).push(pin);
	}
	const nearby = design.maxNearbyPinDistance ?? 100;
	if (!Number.isFinite(nearby) || nearby <= 0) throw new Error('Invalid maxNearbyPinDistance');
	for (const group of byRegionAndNet.values()) {
		for (const [i, a] of group.entries()) {
			for (const b of group.slice(i + 1)) {
				if (a.ref === b.ref) continue;
				const distance = Math.hypot(a.x - b.x, a.y - b.y);
				if (distance > nearby || a.label !== true || b.label !== true
					|| !a.island || !b.island || a.island === b.island) continue;
				report('same-region-labels', a.region, 'candidate',
					{ net: a.net, pins: [a.pin, b.pin], distance, unit: 'source-coordinate' },
					'Pin spacing is not routed length; verify the intended branch and available clearance');
			}
		}
	}

	const branches = index(design.branches, 'id', 'design.branches');
	if (!branches) {
		report('branch-wiring', 'page', 'incomplete', '', 'No decoupling or branch design list supplied');
		return;
	}
	for (const [id, branch] of branches) {
		if (!['decoupling', 'branch'].includes(branch.kind) || !Array.isArray(branch.connections) || !branch.connections.length) {
			throw new Error(`Invalid branch definition: ${id}`);
		}
		for (const { net, pins: endpoints } of branch.connections) {
			if (typeof net !== 'string' || !net.trim() || !Array.isArray(endpoints) || new Set(endpoints).size < 2) {
				throw new Error(`Invalid branch connection: ${id}`);
			}
			const records = endpoints.map(pin => pins.get(pin));
			const mismatches = records.filter(p => p && typeof p.net === 'string' && p.net !== net);
			const evidence = { kind: branch.kind, net, pins: endpoints };
			if (mismatches.length) {
				report('branch-wiring', id, 'fail', { ...evidence, mismatches }, 'Unexpected net');
			} else if (records.some(p => !p || p.net !== net || typeof p.island !== 'string')) {
				report('branch-wiring', id, 'incomplete', evidence, 'Net or physical island evidence missing');
			} else {
				const islands = [...new Set(records.map(p => p.island))];
				const direct = islands.length === 1;
				const labeled = new Set(records.filter(p => p.label === true).map(p => p.island)).size === islands.length;
				report('branch-wiring', id, direct ? 'pass' : labeled ? 'candidate' : 'incomplete',
					{ ...evidence, islands, mode: direct ? 'direct' : labeled ? 'label' : 'unknown' },
					direct ? '' : labeled ? 'Confirm whether a local direct branch is practical' : 'Label attachment evidence missing');
			}
		}
	}
}

function checkLongWires(design, snapshot, limitFor) {
	const paths = index(snapshot.wirePaths, 'id', 'snapshot.wirePaths');
	if (!paths) {
		report('long-wire', 'page', 'incomplete', '', 'Wire paths were not supplied');
		return;
	}
	const grid = snapshot.grid;
	const screen = design.longWireScreen ?? 100;
	if (!Number.isFinite(screen) || screen <= 0) throw new Error('Invalid wire length threshold');
	const knownGrid = Number.isFinite(grid) && grid > 0;
	let unmeasured = 0;
	for (const [id, path] of paths) {
		const g = new Map();
		for (const { a, b, length } of path.segments ?? []) {
			if (typeof a !== 'string' || typeof b !== 'string' || a === b
				|| !Number.isFinite(length) || length <= 0) throw new Error(`Invalid wire segment: ${id}`);
			for (const [from, to] of [[a, b], [b, a]]) {
				if (!g.has(from)) g.set(from, []);
				g.get(from).push([to, length]);
			}
		}
		const ends = [...g.keys()].filter(n => g.get(n).length === 1 || path.pins?.[n]?.length);
		let length = 0, endpoints, limit, measured = false;
		for (const [i, start] of ends.entries()) {
			const paths = distances(g, start);
			for (const end of ends.slice(i + 1)) {
				const distance = paths.get(end);
				if (distance === undefined) continue;
				measured = true;
				const startPins = path.pins?.[start] ?? [];
				const endPins = path.pins?.[end] ?? [];
				const pairLimit = startPins.length === 1 && endPins.length === 1
					? limitFor(startPins[0], endPins[0]) : limitFor();
				if ((knownGrid ? distance / grid > pairLimit : distance > screen) && distance > length) {
					length = distance;
					endpoints = [start, end];
					limit = pairLimit;
				}
			}
		}
		if (!measured) unmeasured++;
		if (endpoints) {
			report('long-wire', id, knownGrid ? 'fail' : 'candidate', {
				net: path.net ?? null, length, unit: 'source-coordinate',
				endpoints: endpoints.map(point => ({ point, pins: path.pins?.[point] ?? [] })),
				...(knownGrid ? { grids: length / grid, limit } : { screen }),
			}, knownGrid ? '' : 'Grid unknown; this is a length screening result');
		}
	}
	if (!knownGrid || unmeasured) report('long-wire-coverage', 'page', 'incomplete',
		{ paths: paths.size, unmeasured }, !knownGrid ? 'Grid size is unknown' : 'Some paths have no measurable endpoint pair');
}

try {
	const design = JSON.parse(readFileSync(designPath, 'utf8').replace(/^\uFEFF/, ''));
	const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8').replace(/^\uFEFF/, ''));
	if (typeof design.page !== 'string' || !design.page.trim() || design.page !== snapshot.page) {
		throw new Error('Design and snapshot must identify the same page');
	}
	const stage = design.stage ?? 'sheet';
	if (!['planning', 'regions', 'placement', 'wiring', 'sheet'].includes(stage)) throw new Error('Invalid audit stage');
	checkSheetPlan(design, snapshot, stage);
	const regions = stage === 'planning' ? null : checkRegions(design, snapshot);
	if (stage !== 'regions' && stage !== 'planning') {
		checkComponents(design, snapshot, regions);
		checkAlignment(design, snapshot);
	}
	if (stage === 'wiring' || stage === 'sheet') {
		const limitFor = wirePolicy(design);
		checkPins(design, snapshot);
		checkSubstitutions(design, snapshot);
		checkWires(design, snapshot, limitFor);
		checkLabelWiring(design, snapshot);
		checkLongWires(design, snapshot, limitFor);
		report('drawing-style', 'page', 'incomplete', '', 'Review label anchors, pin exit directions, clearance, and text legibility separately');
	}
	if (stage === 'sheet') {
		checkReopenedNets(design, snapshot);
		checkDeletedTexts(design, snapshot);
		report('erc-drc-and-structure', 'page', 'incomplete', '', 'Run and review the host checks separately');
		report('visual-and-persistence', 'page', 'incomplete', '', 'Review the drawing and save/reopen evidence separately');
	}
	const candidateReview = reviewCandidates(snapshot);
	const status = checks.some(check => check.status === 'fail') ? 'fail'
		: checks.some(check => check.status === 'incomplete'
			|| (check.status === 'candidate' && check.review?.status !== 'retained')) ? 'incomplete' : 'pass';
	console.log(JSON.stringify({ page: design.page, stage, status, checks, candidateReview }, null, 2));
	process.exitCode = status === 'fail' ? 1 : status === 'incomplete' ? 3 : 0;
} catch (error) {
	console.error(error.message);
	process.exitCode = 2;
}



