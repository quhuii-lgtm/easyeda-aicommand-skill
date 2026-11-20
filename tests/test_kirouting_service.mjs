import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createKiRoutingService } from '../ai-command-engine/scripts/kirouting-service.mjs'

async function fixture(t) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ace-kirouting-service-'))
	t.after(() => rm(root, { recursive: true, force: true }))
	return { root, service: createKiRoutingService({ stateDirectory: path.join(root, 'state') }) }
}
function stable(value) {
	if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
	if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
	return JSON.stringify(value)
}
const sha256 = value => createHash('sha256').update(value).digest('hex')
async function installRuntimeFixture(root, { missingFile } = {}) {
	const scriptDirectory = path.join(root, 'scripts')
	await mkdir(scriptDirectory, { recursive: true })
	const patchContents = [
		{ file: 'length_matching.py', content: 'fixture patched length matching source\n' },
		{ file: 'single_ended_routing.py', content: 'fixture patched via precision source\n' },
	]
	const patchManifest = {
		schemaVersion: 1,
		revision: 'fixture-2026.11.16.1',
		upstream: { version: '0.18.0' },
		patches: patchContents.map(item => ({ file: item.file, sourceSha256: '0'.repeat(64), patchedSha256: sha256(item.content), replacements: [{ old: 'source', new: 'patched source' }] })),
	}
	const patchManifestBytes = Buffer.from(JSON.stringify(patchManifest))
	const lock = {
		version: '0.18.0',
		releaseSha256: 'a'.repeat(64),
		platforms: { 'win32-x64': { rustExtensionVersion: '0.18.1', rustExtension: { sha256: sha256('fixture binary') } } },
	}
	await writeFile(path.join(scriptDirectory, 'kirouting-runtime-patches.json'), patchManifestBytes)
	await writeFile(path.join(scriptDirectory, 'kirouting-runtime-lock.json'), JSON.stringify(lock))
	const stateDirectory = path.join(root, 'state')
	const toolDirectory = path.join(stateDirectory, 'tools', 'kirouting', 'plugins')
	const toolRoot = path.dirname(toolDirectory)
	await mkdir(path.join(toolDirectory, 'rust_router'), { recursive: true })
	const binary = Buffer.from('fixture binary')
	await writeFile(path.join(toolDirectory, 'rust_router', 'grid_router.pyd'), binary)
	const applied = []
	for (const patch of patchManifest.patches) {
		const content = Buffer.from(patchContents.find(item => item.file === patch.file).content)
		assert.equal(sha256(content), patch.patchedSha256)
		if (patch.file !== missingFile) await writeFile(path.join(toolDirectory, patch.file), content)
		applied.push({ file: patch.file, status: 'applied', sourceSha256: patch.sourceSha256, sha256: patch.patchedSha256 })
	}
	const patchRecord = { schemaVersion: 1, revision: patchManifest.revision, patches: applied }
	await writeFile(path.join(toolDirectory, 'ace-adapter-patches.json'), JSON.stringify(patchRecord))
	const pythonExecutable = process.execPath
	const runtime = {
		schemaVersion: 1,
		pythonExecutable,
		toolDirectory,
		version: lock.version,
		rustExtensionVersion: lock.platforms['win32-x64'].rustExtensionVersion,
		releaseSha256: lock.releaseSha256,
		binarySha256: lock.platforms['win32-x64'].rustExtension.sha256,
		adapterPatchRevision: patchManifest.revision,
		patchManifestSha256: sha256(patchManifestBytes),
		adapterPatches: applied,
	}
	await writeFile(path.join(toolRoot, 'runtime.json'), JSON.stringify(runtime))
	return { stateDirectory, scriptDirectory, patchManifest }
}

test('info is read-only with respect to runtime setup and reports protocol/capabilities', async t => {
	const { root, service } = await fixture(t)
	const info = await service.dispatch('info')
	assert.equal(info.ok, true)
	assert.equal(info.data.protocol, 1)
	assert.equal(info.data.runtimeReady, false)
	assert.equal(info.data.setupRequired, true)
	assert.deepEqual(info.data.supportedModes, ['single', 'differential', 'fanout'])
	assert.equal(info.data.adapterPatch.ready, false)
	assert.equal(info.data.supportedModes.includes('length-match'), false)
	assert.match(info.data.manualInstructions, /private user-data runtime/)
	assert.ok(info.data.settingsFields.single.fields.some(field => field.key === 'nets' && field.required && field.source === 'nets'))
	assert.ok(info.data.settingsFields.single.fields.some(field => field.key === 'layers' && field.required && field.source === 'layers'))
	assert.ok(info.data.settingsFields.differential.fields.some(field => field.key === 'pairs' && field.type === 'string[]' && field.source === 'differentialPairs'))
	assert.ok(info.data.settingsFields.fanout.fields.some(field => field.key === 'kind' && field.options.some(option => option.value === 'qfn')))
	assert.ok(info.data.settingsFields.fanout.fields.some(field => field.key === 'escapeMethod' && field.options.some(option => option.value === 'stub') && field.options.some(option => option.value === 'underpad')))
	assert.match(info.data.settingsFields.fanout.fields.find(field => field.key === 'escapeMethod').description, /可能无法扇出全部网络/)
	assert.equal(info.data.constraints.rescue, false)
	assert.equal(info.data.constraints.inputCopperMutation, false)
	assert.equal(await readFile(path.join(root, 'state', 'tools', 'kirouting', 'runtime.json'), 'utf8').catch(() => null), null)
})

test('runtime adapter readiness requires every declared patched source and matching runtime records', async t => {
	const { root } = await fixture(t)
	const { stateDirectory, scriptDirectory, patchManifest } = await installRuntimeFixture(root)
	const info = await createKiRoutingService({ stateDirectory, scriptDirectory }).dispatch('info')
	assert.equal(info.data.runtimeReady, true)
	assert.equal(info.data.adapterPatch.ready, true)
	assert.equal(info.data.adapterPatch.revision, 'fixture-2026.11.16.1')
	assert.deepEqual(info.data.adapterPatch.files.map(file => [file.file, file.ready]), patchManifest.patches.map(patch => [patch.file, true]))
})

test('missing the new precision-patched runtime file prevents adapter readiness', async t => {
	const { root } = await fixture(t)
	const { stateDirectory, scriptDirectory } = await installRuntimeFixture(root, { missingFile: 'single_ended_routing.py' })
	const service = createKiRoutingService({ stateDirectory, scriptDirectory })
	const info = await service.dispatch('info')
	assert.equal(info.data.runtimeReady, false, 'missing precision patch means runtime is not ready')
	assert.equal(info.data.setupRequired, true)
	assert.equal(info.data.adapterPatch.ready, false)
	assert.equal(info.data.adapterPatch.files.find(file => file.file === 'length_matching.py').ready, true)
	assert.equal(info.data.adapterPatch.files.find(file => file.file === 'single_ended_routing.py').ready, false)
	assert.equal(info.data.supportedModes.includes('length-match'), false)
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const ruleEvidence = {
		trackWidth: { status: 'known', mil: 8, source: 'fixture track rule' },
		globalClearance: { status: 'known', mil: 8, source: 'fixture clearance rule' },
		boardEdgeClearance: { status: 'known', mil: 0, source: 'fixture edge rule' },
		via: { status: 'known', diameterMil: 24, drillMil: 12, source: 'fixture via rule' },
	}
	const input = {
		schemaVersion: 1, units: 'mil', inputDigest: 'e'.repeat(64), target,
		board: { outline: [], layers: [{ id: 1, enabled: true }, { id: 2, enabled: true }] },
		nets: [{ name: 'N1', pads: [] }],
		baseline: { source: 'fixture', projectUuid: 'p', documentUuid: 'd', tabId: 't' },
		coverage: { complete: true, unsupported: [], routingConstraintsComplete: false },
		ruleEvidence,
	}
	const settings = { mode: 'single', keep_input_copper: true, nets: ['N1'], layers: [1, 2], trackWidthMil: 8, clearanceMil: 8, boardEdgeClearanceMil: 0, ruleEvidence }
	const singleLayerRefused = await service.dispatch('start', { operationId: 'missing-precision-patch-single-layer', target, input, settings: { ...settings, layers: [1] } })
	assert.equal(singleLayerRefused.error.code, 'ADAPTER_PATCH_UNAVAILABLE', 'single-net routing is blocked until all patched files are present')
	const multilayerRefused = await service.dispatch('start', { operationId: 'missing-precision-patch-multilayer', target, input, settings })
	assert.equal(multilayerRefused.error.code, 'ADAPTER_PATCH_UNAVAILABLE', 'multilayer routing is blocked until all patched files are present')
})

test('manual setup uses the configured state and installer paths with PowerShell-safe quoting', async t => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ace-kirouting-service-'))
	t.after(() => rm(root, { recursive: true, force: true }))
	const stateDirectory = path.join(root, "User's Data Folder")
	const scriptDirectory = path.join(root, "Scripts 'Local'")
	const info = await createKiRoutingService({ stateDirectory, scriptDirectory }).dispatch('info')
	const quote = value => `'${String(value).replaceAll("'", "''")}'`
	assert.ok(info.data.manualInstructions.includes(`$state=${quote(path.resolve(stateDirectory))}`))
	assert.ok(info.data.manualInstructions.includes(`-File ${quote(path.join(path.resolve(scriptDirectory), 'install-kirouting.ps1'))}`))
	assert.ok(info.data.manualInstructions.includes("User''s Data Folder"))
	assert.ok(info.data.manualInstructions.includes("Scripts ''Local''"))
})

test('install requires an explicit confirmed true and start never auto-installs', async t => {
	const { service } = await fixture(t)
	const denied = await service.dispatch('install', { confirmed: false })
	assert.equal(denied.error.code, 'CONFIRMATION_REQUIRED')
	const start = await service.dispatch('start', {})
	assert.equal(start.error.code, 'INVALID_OPERATION_ID')
	const info = await service.dispatch('info')
	assert.equal(info.data.runtimeReady, false)
})

test('start rejects a mismatched baseline and incomplete physical rule mapping', async t => {
	const { service } = await fixture(t)
	const target = { projectUuid: 'project', documentUuid: 'doc', tabId: 'tab' }
	const base = {
		operationId: 'op-1', target,
		input: { schemaVersion: 1, units: 'mil', inputDigest: 'a'.repeat(64), target, board: { outline: [], layers: [{ id: 1, enabled: true }] }, nets: [{ name: 'A', pads: [] }], baseline: { source: 'source', documentUuid: 'doc', projectUuid: 'wrong', tabId: 'tab' }, coverage: { complete: true, unsupported: [], routingConstraintsComplete: false } },
		settings: { mode: 'single', keep_input_copper: true, nets: ['A'], layers: [1], trackWidthMil: 10, clearanceMil: 0, boardEdgeClearanceMil: 0, ruleEvidence: {} },
	}
	assert.equal((await service.dispatch('start', base)).error.code, 'BASELINE_MISMATCH')
	base.input.baseline.projectUuid = 'project'
	assert.equal((await service.dispatch('start', base)).error.code, 'INCOMPLETE_RULE_MAPPING')
})

test('status and result bind jobId, operationId and target; completed missing result is not reported as valid', async t => {
	const { root, service } = await fixture(t)
	const jobId = 'job-1'
	const operationId = 'op-1'
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const dir = path.join(root, 'state', 'kirouting', 'jobs', jobId)
	await mkdir(dir, { recursive: true })
	await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ jobId, operationId, type: 'route', target, inputDigest: 'b'.repeat(64), state: 'completed' }))
	assert.equal((await service.dispatch('status', { jobId, operationId: 'other', target })).error.code, 'JOB_IDENTITY_MISMATCH')
	assert.equal((await service.dispatch('status', { jobId, operationId, target: { ...target, documentUuid: 'other' } })).error.code, 'TARGET_MISMATCH')
	assert.equal((await service.dispatch('result', { jobId, operationId, target })).error.code, 'RESULT_UNAVAILABLE')
	const status = await service.dispatch('status', { jobId, operationId, target })
	assert.equal(status.ok, true)
	assert.equal(status.data.state, 'completed')
})

test('restart converts orphaned running work to unknown without retrying it', async t => {
	const { root } = await fixture(t)
	const jobId = 'orphaned'
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const dir = path.join(root, 'state', 'kirouting', 'jobs', jobId)
	await mkdir(dir, { recursive: true })
	await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ jobId, operationId: 'op', type: 'route', target, inputDigest: 'c'.repeat(64), state: 'running' }))
	const service = createKiRoutingService({ stateDirectory: path.join(root, 'state') })
	const status = await service.dispatch('status', { jobId, target })
	assert.equal(status.data.state, 'unknown')
	const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'))
	assert.equal(manifest.state, 'unknown')
})

test('a completed checked partial result remains retrievable without claiming full routing', async t => {
	const { root, service } = await fixture(t)
	const jobId = 'partial-fanout', operationId = 'op-partial'
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const inputDigest = 'f'.repeat(64)
	const dir = path.join(root, 'state', 'kirouting', 'jobs', jobId)
	await mkdir(dir, { recursive: true })
	await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ jobId, operationId, type: 'route', mode: 'fanout', target, inputDigest, state: 'running' }))
	await writeFile(path.join(dir, 'result.json'), JSON.stringify({ ok: true, result: {
		schemaVersion: 1, units: 'mil', target, inputDigest, lines: [], vias: [],
		existingCopperPreserved: true, removedInputCopper: [],
		statistics: { engineSuccessful: 1, engineFailed: 3, completeBoardAccepted: false },
		modeMetrics: { fanout: [{ succeededNets: ['N1'], failedNets: ['N2', 'N3', 'N4'] }] },
	} }))
	const response = await service.dispatch('result', { jobId, operationId, target })
	assert.equal(response.ok, true)
	assert.equal(response.data.state, 'completed', 'computation ended; board acceptance is a separate result')
	assert.equal(response.data.routingOutcome, 'partial')
	assert.equal(response.data.result.statistics.engineFailed, 3)
	assert.equal(response.data.result.statistics.completeBoardAccepted, false)
})

test('same operation and request reuse the persisted job; changed settings conflict', async t => {
	const { root, service } = await fixture(t)
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const input = { schemaVersion: 1, units: 'mil', inputDigest: 'd'.repeat(64), target, board: { outline: [] }, nets: [], baseline: { source: 's', projectUuid: 'p', documentUuid: 'd', tabId: 't' }, coverage: { complete: true, unsupported: [], routingConstraintsComplete: false } }
	const settings = { mode: 'single', keep_input_copper: true, trackWidthMil: 10, clearanceMil: 0, boardEdgeClearanceMil: 0, ruleEvidence: { trackWidth: { status: 'known', mil: 10, source: 'test' }, globalClearance: { status: 'known', mil: 0, source: 'test' }, boardEdgeClearance: { status: 'known', mil: 0, source: 'test' } } }
	const operationId = 'idempotent-op'
	const requestDigest = createHash('sha256').update(stable({ target, input, settings })).digest('hex')
	const jobId = 'prior-job'
	const dir = path.join(root, 'state', 'kirouting', 'jobs', jobId)
	await mkdir(dir, { recursive: true })
	await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ jobId, type: 'route', operationId, target, inputDigest: input.inputDigest, requestDigest, state: 'running' }))
	const replay = await service.dispatch('start', { operationId, target, input, settings })
	assert.equal(replay.ok, true)
	assert.equal(replay.data.jobId, jobId)
	assert.equal(replay.data.state, 'unknown')
	const conflict = await service.dispatch('start', { operationId, target, input, settings: { ...settings, trackWidthMil: 12 } })
	assert.equal(conflict.error.code, 'OPERATION_CONFLICT')
})

test('differential pair names resolve only through SDK pair records and check gap bounds', async t => {
	const { service } = await fixture(t)
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const input = {
		schemaVersion: 1, units: 'mil', inputDigest: 'e'.repeat(64), target,
		board: { outline: [], layers: [{ id: 1, enabled: true }, { id: 2, enabled: true }] },
		nets: [{ name: 'DP_P', pads: [] }, { name: 'DP_N', pads: [] }],
		choices: { differentialPairs: [{ name: 'CSI_PAIR', positiveNet: 'DP_P', negativeNet: 'DP_N' }] },
		baseline: { source: 's', projectUuid: 'p', documentUuid: 'd', tabId: 't' },
		coverage: { complete: true, unsupported: [], routingConstraintsComplete: false },
		ruleEvidence: {
			trackWidth: { status: 'known', mil: 6, source: 'active differential track width rule' },
			globalClearance: { status: 'known', mil: 6, source: 'active safe spacing matrix' },
			boardEdgeClearance: { status: 'known', mil: 0, source: 'active board-edge track rule' },
			via: { status: 'known', diameterMil: 24, drillMil: 12, source: 'active via size rule' },
			differentialGap: { status: 'known', mil: 6, minimumMil: 6, maximumMil: null, source: 'active default differential-pair spacing' },
		},
	}
	const settings = { mode: 'differential', keep_input_copper: true, pairs: ['CSI_PAIR'], layers: [1, 2], diffPairGapMil: 34 }
	const valid = await service.dispatch('start', { operationId: 'diff-good', target, input, settings })
	assert.equal(valid.error.code, 'RUNTIME_UNAVAILABLE')
	const guessedName = await service.dispatch('start', { operationId: 'diff-guessed', target, input, settings: { ...settings, pairs: ['DP_P/DP_N'] } })
	assert.equal(guessedName.error.code, 'UNKNOWN_DIFFERENTIAL_PAIR')
	const outOfBounds = await service.dispatch('start', { operationId: 'diff-gap', target, input: { ...input, ruleEvidence: { ...input.ruleEvidence, differentialGap: { ...input.ruleEvidence.differentialGap, maximumMil: 30 } } }, settings })
	assert.equal(outOfBounds.error.code, 'DIFFERENTIAL_GAP_OUT_OF_RULE')
	const inconsistentBounds = await service.dispatch('start', { operationId: 'diff-inconsistent-bounds', target, input: { ...input, ruleEvidence: { ...input.ruleEvidence, differentialGap: { ...input.ruleEvidence.differentialGap, minimumMil: 6, maximumMil: 0, source: 'SDK differential spacing rule' } } }, settings })
	assert.equal(inconsistentBounds.error.code, 'INVALID_DIFFERENTIAL_RULE_BOUNDS')
	assert.deepEqual(inconsistentBounds.error.details, { minimumMil: 6, maximumMil: 0, source: 'SDK differential spacing rule', nextStep: 'Save, close and reopen the new board, then read the differential rule again.' })
	assert.match(inconsistentBounds.error.message, /上限 0 mil 小于下限 6 mil/)
	assert.match(inconsistentBounds.error.message, /SDK differential spacing rule/)
	assert.match(inconsistentBounds.error.message, /保存并关闭重开/)
	assert.match(inconsistentBounds.error.message, /不会把 0 当作无上限/)
	const missingSource = await service.dispatch('start', { operationId: 'diff-missing-source', target, input: { ...input, ruleEvidence: { ...input.ruleEvidence, differentialGap: { ...input.ruleEvidence.differentialGap, maximumMil: 0, source: '' } } }, settings })
	assert.equal(missingSource.error.code, 'INCOMPLETE_RULE_MAPPING')
})

test('QFN fanout derives its layer list from escapeLayer and checks stub mounting layer', async t => {
	const { service } = await fixture(t)
	const target = { projectUuid: 'p', documentUuid: 'd', tabId: 't' }
	const input = {
		schemaVersion: 1, units: 'mil', inputDigest: 'f'.repeat(64), target,
		board: { outline: [], layers: [{ id: 1, enabled: true }, { id: 2, enabled: true }] },
		components: [{ id: 'U1', layer: 1 }], nets: [{ name: 'N1', pads: [] }],
		baseline: { source: 's', projectUuid: 'p', documentUuid: 'd', tabId: 't' },
		coverage: { complete: true, unsupported: [], routingConstraintsComplete: false },
		ruleEvidence: {
			trackWidth: { status: 'known', mil: 6, source: 'test active track rule' },
			globalClearance: { status: 'known', mil: 6, source: 'test active clearance rule' },
			boardEdgeClearance: { status: 'known', mil: 0, source: 'test active edge rule' },
			via: { status: 'known', diameterMil: 24, drillMil: 12, source: 'test active via rule' },
		},
	}
	const settings = { mode: 'fanout', kind: 'qfn', keep_input_copper: true, componentIds: ['U1'], escapeLayer: '2', nets: ['N1'], escapeMethod: 'underpad', extensionMil: 20, gridStepMil: 0 }
	assert.equal((await service.dispatch('start', { operationId: 'qfn-no-duplicate-layer', target, input, settings })).error.code, 'RUNTIME_UNAVAILABLE')
	assert.equal((await service.dispatch('start', { operationId: 'qfn-mismatched-direct-layers', target, input, settings: { ...settings, layers: [1] } })).error.code, 'INVALID_LAYERS')
	assert.equal((await service.dispatch('start', { operationId: 'qfn-stub-wrong-mount-layer', target, input, settings: { ...settings, escapeMethod: 'stub' } })).error.code, 'INVALID_LAYERS')
})
