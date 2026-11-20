import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const thisDirectory = path.dirname(fileURLToPath(import.meta.url))
const PROTOCOL = 1
const MODES = ['single', 'differential', 'length-match', 'fanout']

function stable(value) {
	if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
	if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
	return JSON.stringify(value)
}
function digest(value) { return createHash('sha256').update(stable(value)).digest('hex') }
function cleanError(error) { return String(error?.message ?? error).slice(0, 1200) }
function sameTarget(a, b) { return a && b && ['instanceId', 'projectUuid', 'documentUuid', 'tabId'].every(key => (a[key] ?? '') === (b[key] ?? '')) }
function powershellQuote(value) { return `'${String(value).replaceAll("'", "''")}'` }
function routingOutcome(result) {
	if (Number(result?.statistics?.engineFailed ?? 0) > 0 || (result?.modeMetrics?.fanout ?? []).some(item => (item.failedNets?.length ?? 0) > 0)) return 'partial'
	if ((result?.modeMetrics?.groupSkew ?? []).some(item => item.withinTolerance === false)) return 'constraints-not-met'
	return 'generated'
}
function fail(code, message, details) { return { ok: false, error: { code, message, ...(details ? { details } : {}) } } }

export function createKiRoutingService({ stateDirectory, scriptDirectory = thisDirectory } = {}) {
	if (!stateDirectory) throw new TypeError('stateDirectory is required')
	const stateRoot = path.resolve(stateDirectory, 'kirouting')
	const jobsRoot = path.join(stateRoot, 'jobs')
	const toolsRoot = path.resolve(stateDirectory, 'tools', 'kirouting')
	const scriptRoot = path.resolve(scriptDirectory)
	const runnerPath = path.join(scriptRoot, 'kirouting-runner.py')
	const installPath = path.join(scriptRoot, 'install-kirouting.ps1')
	const jobs = new Map()
	const children = new Map()
	let ready

	async function init() {
		if (!ready) ready = (async () => {
			await fs.mkdir(jobsRoot, { recursive: true })
			for (const entry of await fs.readdir(jobsRoot, { withFileTypes: true })) {
				if (!entry.isDirectory()) continue
				try {
					const file = path.join(jobsRoot, entry.name, 'manifest.json')
					const job = JSON.parse(await fs.readFile(file, 'utf8'))
					if (!job?.jobId) continue
					if (job.state === 'running' || job.state === 'stopping') {
						let terminal
						try { terminal = JSON.parse(await fs.readFile(path.join(jobsRoot, entry.name, 'result.json'), 'utf8')) } catch { }
						if (job.type === 'route' && terminal?.ok === true && terminal.result?.inputDigest === job.inputDigest && terminal.result?.target && sameTarget(terminal.result.target, job.target)) { job.state = 'completed'; job.routingOutcome = routingOutcome(terminal.result) }
						else if (job.type === 'install' && terminal?.status === 'completed') job.state = 'completed'
						else if (job.type === 'install' && terminal?.status === 'needsPython') job.state = 'needsPython'
						else if (terminal && terminal.ok === false) { job.state = 'failed'; job.error = terminal.error?.message ?? 'Persisted job failed.' }
						else job.state = 'unknown'
						const file = path.join(jobsRoot, entry.name, 'manifest.json')
						const tmp = `${file}.${randomUUID()}.tmp`
						await fs.writeFile(tmp, JSON.stringify({ ...job, recoveredAt: new Date().toISOString() }, null, 2), 'utf8')
						await fs.rename(tmp, file)
					}
					jobs.set(job.jobId, job)
				} catch { /* incomplete job directory is not resumable */ }
			}
		})()
		return ready
	}
	const jobDir = job => path.join(jobsRoot, job.jobId)
	async function save(job, patch = {}) {
		Object.assign(job, patch, { updatedAt: new Date().toISOString() })
		await fs.mkdir(jobDir(job), { recursive: true })
		const file = path.join(jobDir(job), 'manifest.json')
		const temp = `${file}.${randomUUID()}.tmp`
		await fs.writeFile(temp, JSON.stringify(job, null, 2), 'utf8')
		try { await fs.rename(temp, file) } catch (error) { await fs.rm(temp, { force: true }); throw error }
	}
	async function readRuntime() {
		const runtimePath = path.join(toolsRoot, 'runtime.json')
		let runtime
		try { runtime = JSON.parse(await fs.readFile(runtimePath, 'utf8')) } catch { return { runtimePath, runtime: null } }
		let lock
		try { lock = JSON.parse(await fs.readFile(path.join(scriptRoot, 'kirouting-runtime-lock.json'), 'utf8')) } catch { return { runtimePath, runtime: null, invalid: true } }
		let patchManifest
		let patchManifestHash
		try {
			const patchFile = path.join(scriptRoot, 'kirouting-runtime-patches.json')
			const patchBytes = await fs.readFile(patchFile)
			patchManifest = JSON.parse(patchBytes.toString('utf8'))
			patchManifestHash = createHash('sha256').update(patchBytes).digest('hex')
		} catch { return { runtimePath, runtime: null, invalid: true } }
		const winLock = lock?.platforms?.['win32-x64']
		if (runtime?.schemaVersion !== 1 || !path.isAbsolute(runtime.pythonExecutable ?? '') || !path.isAbsolute(runtime.toolDirectory ?? '') || runtime.version !== lock.version || runtime.releaseSha256 !== lock.releaseSha256 || runtime.binarySha256 !== winLock?.rustExtension?.sha256 || runtime.rustExtensionVersion !== winLock?.rustExtensionVersion) return { runtimePath, runtime: null, invalid: true }
		try {
			await fs.access(runtime.pythonExecutable)
			await fs.access(runtime.toolDirectory)
			const binary = await fs.readFile(path.join(runtime.toolDirectory, 'rust_router', 'grid_router.pyd'))
			if (createHash('sha256').update(binary).digest('hex') !== runtime.binarySha256) return { runtimePath, runtime: null, invalid: true }
			const patchInfos = patchManifest?.schemaVersion === 1 && patchManifest.upstream?.version === lock.version && Array.isArray(patchManifest.patches) ? patchManifest.patches : []
			let patchRecord
			try { patchRecord = JSON.parse(await fs.readFile(path.join(runtime.toolDirectory, 'ace-adapter-patches.json'), 'utf8')) } catch { }
			const patchFiles = []
			const seenFiles = new Set()
			for (const patchInfo of patchInfos) {
				let ready = false
				let sha256
				if (typeof patchInfo?.file === 'string' && !seenFiles.has(patchInfo.file) && path.basename(patchInfo.file) === patchInfo.file && typeof patchInfo.patchedSha256 === 'string') {
					seenFiles.add(patchInfo.file)
					try {
						const patchPath = path.resolve(runtime.toolDirectory, patchInfo.file)
						if (path.dirname(patchPath) === path.resolve(runtime.toolDirectory)) {
							const patchBytes = await fs.readFile(patchPath)
							sha256 = createHash('sha256').update(patchBytes).digest('hex')
							const records = patchRecord?.patches?.filter(item => item.file === patchInfo.file) ?? []
							const runtimeRecords = runtime.adapterPatches?.filter(item => item.file === patchInfo.file) ?? []
							ready = sha256 === patchInfo.patchedSha256
								&& records.length === 1
								&& records[0].sha256 === patchInfo.patchedSha256
								&& ['applied', 'already-applied'].includes(records[0].status)
								&& runtimeRecords.length === 1
								&& runtimeRecords[0].sha256 === patchInfo.patchedSha256
						}
					} catch { }
				}
				patchFiles.push({ file: patchInfo?.file, ready, sha256 })
			}
			const patchRecordFiles = patchRecord?.patches
			const runtimePatchFiles = runtime.adapterPatches
			const patchReady = patchInfos.length > 0
				&& seenFiles.size === patchInfos.length
				&& patchFiles.every(item => item.ready)
				&& Array.isArray(patchRecordFiles) && patchRecordFiles.length === patchInfos.length
				&& Array.isArray(runtimePatchFiles) && runtimePatchFiles.length === patchInfos.length
				&& patchRecord?.schemaVersion === 1
				&& patchRecord.revision === patchManifest.revision
				&& runtime.adapterPatchRevision === patchManifest.revision
				&& runtime.patchManifestSha256 === patchManifestHash
			return { runtimePath, runtime, patchReady, patchRevision: patchManifest.revision, patchedSourceSha256: patchInfos.find(item => item.file === 'length_matching.py')?.patchedSha256, patchFiles }
		} catch { return { runtimePath, runtime: null, invalid: true } }
	}
	async function locate(jobId, operationId, target) {
		if (jobId) return jobs.get(jobId)
		if (!operationId || !target) return undefined
		return [...jobs.values()].find(job => job.operationId === operationId && sameTarget(job.target, target))
	}
	async function publicJob(job, withResult = false) {
		if (!job) return undefined
		let result
		let progress = job.progress
		if (['running', 'stopping'].includes(job.state)) {
			try { progress = JSON.parse(await fs.readFile(path.join(jobDir(job), 'progress.json'), 'utf8')) } catch { }
		}
		if (withResult && job.state === 'completed') {
			try {
				const envelope = JSON.parse(await fs.readFile(path.join(jobDir(job), 'result.json'), 'utf8'))
				result = job.type === 'route' ? envelope.result : envelope
			} catch { /* report missing result below */ }
		}
		return { engine: 'kirouting', type: job.type, jobId: job.jobId, operationId: job.operationId, target: job.target, state: job.state, routingOutcome: job.routingOutcome, inputDigest: job.inputDigest, ...(job.error ? { error: job.error } : {}), ...(progress ? { progress } : {}), ...(withResult ? { format: 'kirouting-json', result } : {}) }
	}
	function appendLog(job, name, chunk) {
		fs.appendFile(path.join(jobDir(job), name), chunk).catch(() => {})
	}
	async function launch(job, executable, args, env = process.env) {
		await fs.mkdir(jobDir(job), { recursive: true })
		await save(job, { state: 'running', startedAt: new Date().toISOString() })
		let child
		try {
			child = spawn(executable, args, { cwd: jobDir(job), env, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
		} catch (error) {
			await save(job, { state: 'failed', error: cleanError(error) })
			return
		}
		children.set(job.jobId, child)
		child.stdout.on('data', chunk => appendLog(job, 'stdout.log', chunk))
		child.stderr.on('data', chunk => appendLog(job, 'stderr.log', chunk))
		child.on('error', async error => { await save(job, { state: 'failed', error: cleanError(error) }); children.delete(job.jobId) })
		child.on('close', async (code, signal) => {
			children.delete(job.jobId)
			if (job.type === 'install') {
				let installerResult
				try { installerResult = JSON.parse(await fs.readFile(path.join(jobDir(job), 'result.json'), 'utf8')) } catch { }
				if (installerResult?.status === 'needsPython') await save(job, { state: 'needsPython', progress: installerResult.data ?? { message: installerResult.message } })
				else if (installerResult?.status === 'completed' && code === 0) await save(job, { state: 'completed', progress: installerResult.data ?? { message: installerResult.message } })
				else if (job.stopRequested && code !== 0) await save(job, { state: 'cancelled', progress: { signal } })
				else await save(job, { state: 'failed', error: installerResult?.message ?? `installer exit=${code} signal=${signal ?? ''}` })
				return
			}
			let runnerResult
			try { runnerResult = JSON.parse(await fs.readFile(path.join(jobDir(job), 'result.json'), 'utf8')) } catch { }
			if (runnerResult?.ok === true && code === 0) await save(job, { state: 'completed', routingOutcome: routingOutcome(runnerResult.result) })
			else if (job.stopRequested && code !== 0) await save(job, { state: 'cancelled' })
			else await save(job, { state: 'failed', error: runnerResult?.error?.message ?? `runner exit=${code} signal=${signal ?? ''}` })
		})
	}
	async function info() {
		await init()
		const { runtimePath, runtime, invalid, patchReady, patchRevision, patchedSourceSha256, patchFiles } = await readRuntime()
		const manualState = powershellQuote(path.resolve(stateDirectory))
		const manualScript = powershellQuote(installPath)
		const ready = Boolean(runtime && patchReady)
		return { ok: true, data: { protocol: PROTOCOL, engine: 'kirouting', version: '0.18.0', runtimeReady: ready, setupRequired: !ready, runtimePath, invalidRuntime: Boolean(invalid || (runtime && !patchReady)), adapterPatch: { revision: patchRevision, ready: !!patchReady, files: patchFiles ?? [], lengthMatchingSourceSha256: patchedSourceSha256 }, testedPlatform: 'win32-x64', testedPython: '3.12', minimumAbi: '3.9', capabilitySemantics: 'supportedModes lists implemented callable adapters; it does not mean a board passed routing, connectivity, DRC, or manufacturing validation.', supportedModes: ['single', 'differential', 'fanout', ...(patchReady ? ['length-match'] : [])], limitations: ['BGA fanout is unavailable pending verification.', 'QFN escape modes may leave selected nets incomplete; inspect each job result and failed-net list.', 'QFN fanout output is only candidate escape geometry; complete routing, native DRC and EDA import require separate checks.'], manualInstructions: `Manual setup uses a private user-data runtime and does not require administrator rights or global pip. Install 64-bit Python 3.12 for your user, then run Windows PowerShell 5.1: $state=${manualState}; $job=Join-Path $state ('kirouting\\jobs\\manual-'+[guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Force -Path $job | Out-Null; & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ${manualScript} -Install -StateDirectory $state -JobDirectory $job -PythonExe '<full path to python.exe>'; Get-Content (Join-Path $job 'result.json')`, settingsFields: {
			single: { fields: [
				{ key: 'nets', type: 'string[]', required: true, source: 'nets', label: '选择要布线的网络', description: '从当前PCB未布线网络中选择' },
				{ key: 'layers', type: 'string[]', required: true, source: 'layers', label: '选择布线铜层', description: '从当前PCB可用SIGNAL层中选择' },
				{ key: 'gridStepMil', type: 'number', required: false, default: 5, label: '网格步进（mil）' },
			] },
			differential: { fields: [
				{ key: 'pairs', type: 'string[]', required: true, source: 'differentialPairs', label: '选择差分对', description: '仅使用当前EDA已定义的差分对；不按网络名称推测' },
				{ key: 'layers', type: 'string[]', required: true, source: 'layers', label: '选择布线铜层' },
				{ key: 'diffPairGapMil', type: 'number', required: true, label: '差分间距（mil）', description: '须在当前差分间距规则的已知上下限内' },
			] },
			fanout: { fields: [
				{ key: 'kind', type: 'string', required: true, options: [{ value: 'qfn', displayContent: 'QFN/QFP' }], default: 'qfn', label: '封装扇出类型', description: '当前仅验证QFN/QFP扇出；BGA尚未验证' },
				{ key: 'componentIds', type: 'string[]', required: true, source: 'components', label: '选择目标器件', description: '从当前PCB器件中选择需要扇出的器件' },
				{ key: 'escapeLayer', type: 'string', required: true, source: 'layers', label: '选择过孔后的接续铜层', description: 'underpad只生成到过孔的扇出几何，不会自动在此层继续布线；stub须与器件安装层相同' },
				{ key: 'nets', type: 'string[]', required: true, source: 'nets', label: '选择扇出网络', description: '从当前PCB网络中选择' },
				{ key: 'escapeMethod', type: 'string', required: true, options: [{ value: 'underpad', displayContent: '焊盘下方扇出' }, { value: 'stub', displayContent: '短引线扇出' }], default: 'underpad', label: '扇出方式', description: '不同封装和参数可能无法扇出全部网络；提交后请检查失败网络结果' },
				{ key: 'extensionMil', type: 'number', required: true, label: '扇出延伸长度（mil）' },
				{ key: 'gridStepMil', type: 'number', required: true, default: 0, label: '网格步进（mil）' },
			] },
			'length-match': { fields: [
				{ key: 'nets', type: 'string[]', required: true, source: 'nets', label: '选择需要路由的网络' },
				{ key: 'layers', type: 'string[]', required: true, source: 'layers', label: '选择布线铜层' },
				{ key: 'groups', type: 'string[]', required: true, source: 'lengthMatchGroups', label: '选择等长组' },
				{ key: 'toleranceMil', type: 'number', required: true, default: 5, label: '组内最大长度差（mil）', description: '使用本次任务明确指定的容差；不得为通过验收自动放宽' },
				{ key: 'meanderAmplitudeMil', type: 'number', required: true, default: 20, min: 0.2 / 0.0254, label: '蛇形调节幅度（mil）', description: '固定引擎最小振幅为0.2 mm，约7.874 mil；不会自动提高用户设置' },
			] },
		}, constraints: { rescue: false, inputCopperMutation: false, netSwap: false, polaritySwap: false, blindBuriedVias: false }, install: { action: 'install', requiresConfirmedTrue: true, installer: installPath } } }
	}
	async function install(params = {}) {
		await init()
		if (params.confirmed !== true) return fail('CONFIRMATION_REQUIRED', 'install requires confirmed:true')
		if (process.platform !== 'win32') return fail('UNSUPPORTED_PLATFORM', 'The pinned installation bundle is currently verified for Windows x64.')
		const prior = [...jobs.values()].find(job => job.type === 'install' && ['running', 'stopping', 'unknown'].includes(job.state))
		if (prior) return { ok: true, data: await publicJob(prior) }
		const job = { jobId: randomUUID(), type: 'install', operationId: randomUUID(), target: null, state: 'queued', createdAt: new Date().toISOString(), installer: installPath }
		jobs.set(job.jobId, job)
		await fs.mkdir(jobDir(job), { recursive: true })
		await save(job)
		const ps = process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe') : 'powershell.exe'
		await launch(job, ps, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', installPath, '-Install', '-StateDirectory', path.resolve(stateDirectory), '-JobDirectory', jobDir(job)])
		return { ok: true, data: await publicJob(job) }
	}
	async function start(params = {}) {
		await init()
		const { operationId, target, input, settings } = params
		if (typeof operationId !== 'string' || !operationId.trim()) return fail('INVALID_OPERATION_ID', 'operationId must be a non-empty string')
		if (!target || !['projectUuid', 'documentUuid', 'tabId'].every(key => typeof target[key] === 'string' && target[key])) return fail('INVALID_TARGET', 'target must include projectUuid, documentUuid and tabId')
		if (!input || input.schemaVersion !== 1 || input.units !== 'mil' || !Array.isArray(input.nets) || !Array.isArray(input.board?.outline)) return fail('INVALID_INPUT', 'Input must use schemaVersion 1, mil units, nets and board outline')
		if (input.target && !sameTarget(input.target, target)) return fail('TARGET_MISMATCH', 'input.target differs from request target')
		if (input.baseline?.documentUuid !== target.documentUuid || input.baseline?.projectUuid !== target.projectUuid || input.baseline?.tabId !== target.tabId) return fail('BASELINE_MISMATCH', 'Baseline target does not match request target')
		const requestDigest = digest({ target, input, settings })
		const existing = [...jobs.values()].find(job => job.type === 'route' && job.operationId === operationId)
		if (existing) {
			if (!sameTarget(existing.target, target) || existing.requestDigest !== requestDigest) return fail('OPERATION_CONFLICT', 'This operationId is already bound to different input or target.')
			return { ok: true, data: await publicJob(existing) }
		}
		if (!settings || !MODES.includes(settings.mode)) return fail('INVALID_MODE', `mode must be one of ${MODES.join(', ')}`)
		if (settings.mode === 'differential') {
			const availablePairs = Array.isArray(input.choices?.differentialPairs) ? input.choices.differentialPairs : []
			if (!Array.isArray(settings.pairs) || settings.pairs.length === 0) return fail('INVALID_DIFFERENTIAL_PAIRS', 'Differential mode requires explicit selected pairs.')
			const pairs = []
			for (const selected of settings.pairs) {
				let pair
				if (typeof selected === 'string') {
					const match = availablePairs.filter(item => item?.name === selected)
					if (match.length !== 1) return fail('UNKNOWN_DIFFERENTIAL_PAIR', `No unique SDK-defined differential pair named ${selected}.`)
					pair = match[0]
				} else if (Array.isArray(selected) && selected.length === 2) pair = { positiveNet: selected[0], negativeNet: selected[1] }
				else if (selected && typeof selected === 'object') pair = { positiveNet: selected.positiveNet, negativeNet: selected.negativeNet }
				else return fail('INVALID_DIFFERENTIAL_PAIRS', 'Each pair must be an SDK pair name, a [positiveNet,negativeNet] tuple, or an explicit positiveNet/negativeNet object.')
				if (typeof pair.positiveNet !== 'string' || typeof pair.negativeNet !== 'string' || pair.positiveNet === pair.negativeNet || !input.nets.some(net => net.name === pair.positiveNet) || !input.nets.some(net => net.name === pair.negativeNet)) return fail('INVALID_DIFFERENTIAL_PAIRS', 'Pair nets must be distinct existing input net names.')
				pairs.push({ positiveNet: pair.positiveNet, negativeNet: pair.negativeNet })
			}
			const pairNets = pairs.flatMap(pair => [pair.positiveNet, pair.negativeNet])
			if (new Set(pairNets).size !== pairNets.length) return fail('INVALID_DIFFERENTIAL_PAIRS', 'A net cannot appear in more than one selected differential pair.')
			if (!Array.isArray(settings.layers) || !settings.layers.length) return fail('INVALID_LAYERS', 'Differential routing requires explicit SIGNAL layers.')
			const gap = input.ruleEvidence?.differentialGap
			if (gap?.status !== 'known' || !Number.isFinite(gap.minimumMil) || gap.minimumMil < 0 || typeof gap.source !== 'string' || !gap.source) return fail('INCOMPLETE_RULE_MAPPING', 'Differential-pair spacing rule is unknown or lacks an explicit source.')
			if (gap.maximumMil != null && !Number.isFinite(gap.maximumMil)) return fail('INCOMPLETE_RULE_MAPPING', 'Differential-pair maximum spacing is not a finite value.')
			if (gap.maximumMil != null && gap.maximumMil < gap.minimumMil) return fail('INVALID_DIFFERENTIAL_RULE_BOUNDS', `当前差分间距规则上限 ${gap.maximumMil} mil 小于下限 ${gap.minimumMil} mil，来源：${gap.source}。新建板可先保存并关闭重开，再读取规则确认；不会把 0 当作无上限，也不会自动修改规则。`, { minimumMil: gap.minimumMil, maximumMil: gap.maximumMil, source: gap.source, nextStep: 'Save, close and reopen the new board, then read the differential rule again.' })
			if (!Number.isFinite(settings.diffPairGapMil) || settings.diffPairGapMil < gap.minimumMil || (gap.maximumMil != null && settings.diffPairGapMil > gap.maximumMil)) return fail('DIFFERENTIAL_GAP_OUT_OF_RULE', `diffPairGapMil must be within the known rule bounds ${gap.minimumMil}..${gap.maximumMil ?? 'unbounded'} mil.`)
			if (settings.nets && (settings.nets.length !== pairNets.length || pairNets.some(net => !settings.nets.includes(net)))) return fail('INVALID_NETS', 'nets, when supplied, must exactly match the selected differential pairs.')
			settings.pairs = pairs
			settings.nets = pairNets
		} else if (settings.mode === 'length-match') {
			const patchRuntime = await readRuntime()
			if (!patchRuntime.runtime) return fail('RUNTIME_UNAVAILABLE', 'KiRouting runtime is not installed; info and explicit install are available.', { runtimePath: patchRuntime.runtimePath })
			if (!patchRuntime.patchReady) return fail('ADAPTER_PATCH_UNAVAILABLE', `Routing requires every versioned, hash-verified adapter patch in this runtime (${patchRuntime.patchRevision ?? 'unknown revision'}).`)
			if (!Array.isArray(settings.groups) || settings.groups.length === 0) return fail('INVALID_LENGTH_GROUPS', 'Length matching requires explicit group selections.')
			const availableGroups = Array.isArray(input.choices?.lengthMatchGroups) ? input.choices.lengthMatchGroups : []
			const groups = []
			for (const selected of settings.groups) {
				let group
				if (typeof selected === 'string') {
					const matches = availableGroups.filter(item => item?.name === selected)
					if (matches.length !== 1) return fail('UNKNOWN_LENGTH_GROUP', `No unique SDK-defined length group named ${selected}.`)
					group = matches[0]
				} else if (Array.isArray(selected)) group = { nets: selected }
				else if (selected && typeof selected === 'object') group = selected
				else return fail('INVALID_LENGTH_GROUPS', 'Each length group must be an SDK group name, net array or explicit nets object.')
				if (!Array.isArray(group.nets) || group.nets.length < 2 || group.nets.some(net => typeof net !== 'string' || !input.nets.some(row => row.name === net)) || new Set(group.nets).size !== group.nets.length) return fail('INVALID_LENGTH_GROUPS', 'Each length group must contain at least two distinct input net names.')
				groups.push({ name: group.name, nets: [...group.nets] })
			}
			const groupedNets = groups.flatMap(group => group.nets)
			if (new Set(groupedNets).size !== groupedNets.length) return fail('INVALID_LENGTH_GROUPS', 'A net cannot occur in more than one selected length group.')
			if (!Array.isArray(settings.nets) || settings.nets.length !== groupedNets.length || groupedNets.some(net => !settings.nets.includes(net))) return fail('INVALID_NETS', 'nets must exactly match the selected length-match groups.')
			if (!Number.isFinite(settings.toleranceMil) || settings.toleranceMil < 0) return fail('INVALID_TOLERANCE', 'toleranceMil must be the explicitly requested finite non-negative tolerance; it is never relaxed automatically.')
			if (!Number.isFinite(settings.meanderAmplitudeMil) || settings.meanderAmplitudeMil < 0.2 / 0.0254) return fail('INVALID_MEANDER_AMPLITUDE', 'The pinned engine minimum meander amplitude is 0.2 mm (about 7.874 mil); the requested value will not be raised automatically.')
			settings.groups = groups
		} else if (settings.mode === 'fanout') {
			if (settings.kind !== 'qfn') return fail('MODE_NOT_IMPLEMENTED', 'Only QFN/QFP fanout is verified; BGA fanout is not declared supported.')
			if (!['stub', 'underpad'].includes(settings.escapeMethod)) return fail('INVALID_ESCAPE_METHOD', 'QFN escapeMethod must be stub or underpad; automatic fallback is disabled.')
			if (!Array.isArray(settings.componentIds) || settings.componentIds.length === 0 || settings.componentIds.some(id => !input.components.some(component => String(component.id) === String(id)))) return fail('INVALID_COMPONENTS', 'componentIds must select one or more components present in the input.')
			if (!Array.isArray(settings.nets) || settings.nets.length === 0 || settings.nets.some(net => !input.nets.some(row => row.name === net))) return fail('INVALID_NETS', 'QFN fanout requires explicit nets from the input.')
			if (!Number.isFinite(Number(settings.escapeLayer))) return fail('INVALID_LAYERS', 'QFN fanout requires one explicit continuation escapeLayer.')
			if (!input.board.layers.some(layer => Number(layer.id) === Number(settings.escapeLayer) && layer.enabled !== false)) return fail('INVALID_LAYERS', 'escapeLayer must be an enabled copper layer from the input.')
			if (settings.layers !== undefined && (!Array.isArray(settings.layers) || settings.layers.length !== 1 || Number(settings.layers[0]) !== Number(settings.escapeLayer))) return fail('INVALID_LAYERS', 'Optional direct-call layers must contain only escapeLayer.')
			settings.layers = [Number(settings.escapeLayer)]
			if (settings.escapeMethod === 'stub' && settings.componentIds.some(id => {
				const component = input.components.find(row => String(row.id) === String(id))
				return Number(component?.layer) !== Number(settings.escapeLayer)
			})) return fail('INVALID_LAYERS', 'QFN stub fanout must use the selected footprint mounting layer.')
			if (!Number.isFinite(settings.extensionMil) || settings.extensionMil <= 0 || !Number.isFinite(settings.gridStepMil) || settings.gridStepMil < 0) return fail('INVALID_FANOUT_SETTINGS', 'extensionMil must be positive and gridStepMil must be non-negative.')
		} else if (settings.mode !== 'single') return fail('MODE_NOT_IMPLEMENTED', `The ${settings.mode} adapter has not yet been verified against this input schema.`)
		if (!Array.isArray(settings.layers) || !settings.layers.length) return fail('INVALID_LAYERS', 'Explicit routing layers are required.')
		const selectedLayers = settings.layers.map(Number)
		if (selectedLayers.some(layerId => !Number.isInteger(layerId) || !input.board.layers.some(layer => Number(layer.id) === layerId && layer.enabled !== false)) || new Set(selectedLayers).size !== selectedLayers.length) return fail('INVALID_LAYERS', 'Routing layers must be unique enabled SIGNAL layer IDs from the input.')
		if (settings.mode === 'single' && (!Array.isArray(settings.nets) || settings.nets.length === 0 || settings.nets.some(net => !input.nets.some(row => row.name === net)))) return fail('INVALID_NETS', 'Single-ended routing requires explicit target nets from the input.')
		if (settings.keep_input_copper !== true) return fail('INPUT_COPPER_POLICY', 'keep_input_copper:true is mandatory')
		if (settings.polaritySwap === true || settings.netSwap === true || settings.rescue === true) return fail('UNSAFE_OPTION', 'Polarity/net swaps and rescue are disabled')
		if (input.coverage?.complete !== true || (input.coverage?.unsupported?.length ?? 1) !== 0) return fail('INCOMPLETE_GEOMETRY_COVERAGE', 'Cannot route when board, pads or copper obstacle geometry is incomplete.', input.coverage)
		const ruleEvidence = settings.ruleEvidence ?? input.ruleEvidence
		const requiredRuleEvidence = ['trackWidth', 'globalClearance', 'boardEdgeClearance']
		const missingRuleEvidence = requiredRuleEvidence.filter(key => !ruleEvidence || ruleEvidence[key]?.status !== 'known' || !Number.isFinite(ruleEvidence[key]?.mil) || ruleEvidence[key].mil < 0 || (key === 'trackWidth' && ruleEvidence[key].mil === 0) || typeof ruleEvidence[key]?.source !== 'string' || !ruleEvidence[key].source)
		if (missingRuleEvidence.length) return fail('INCOMPLETE_RULE_MAPPING', `Missing explicit physical rule values/provenance: ${missingRuleEvidence.join(', ')}`, { missing: missingRuleEvidence, routingConstraintsComplete: input.coverage?.routingConstraintsComplete })
		const effectiveSettings = { ...settings,
			trackWidthMil: settings.trackWidthMil ?? ruleEvidence?.trackWidth?.mil,
			clearanceMil: settings.clearanceMil ?? ruleEvidence?.globalClearance?.mil,
			boardEdgeClearanceMil: settings.boardEdgeClearanceMil ?? ruleEvidence?.boardEdgeClearance?.mil,
		}
		if (!Number.isFinite(effectiveSettings.trackWidthMil) || effectiveSettings.trackWidthMil <= 0 || !Number.isFinite(effectiveSettings.clearanceMil) || effectiveSettings.clearanceMil < 0 || !Number.isFinite(effectiveSettings.boardEdgeClearanceMil) || effectiveSettings.boardEdgeClearanceMil < 0) return fail('INVALID_PHYSICAL_SETTINGS', 'Track width must be positive and global/board-edge clearances must be finite non-negative mil values.')
		if (effectiveSettings.layers && !Array.isArray(effectiveSettings.layers)) return fail('INVALID_LAYERS', 'layers must be an array of numeric layer IDs.')
		const routeLayers = effectiveSettings.layers?.map(Number) ?? input.board.layers.filter(layer => layer.enabled !== false).map(layer => Number(layer.id))
		const viaEvidenceKnown = ruleEvidence?.via?.status === 'known' && Number.isFinite(ruleEvidence.via.diameterMil) && Number.isFinite(ruleEvidence.via.drillMil) && Boolean(ruleEvidence.via.source)
		if (viaEvidenceKnown) {
			effectiveSettings.viaSizeMil = effectiveSettings.viaSizeMil ?? ruleEvidence.via.diameterMil
			effectiveSettings.viaDrillMil = effectiveSettings.viaDrillMil ?? ruleEvidence.via.drillMil
			if (Math.abs(effectiveSettings.viaSizeMil - ruleEvidence.via.diameterMil) > 1e-6 || Math.abs(effectiveSettings.viaDrillMil - ruleEvidence.via.drillMil) > 1e-6) return fail('RULE_VALUE_MISMATCH', 'Via settings must match the reported known rule evidence.')
		} else if (routeLayers.length > 1 || effectiveSettings.mode === 'fanout') return fail('INCOMPLETE_RULE_MAPPING', 'Multilayer routing and QFN fanout require explicit known via diameter and drill rule evidence.')
		if (Math.abs(effectiveSettings.trackWidthMil - ruleEvidence.trackWidth.mil) > 1e-6 || Math.abs(effectiveSettings.clearanceMil - ruleEvidence.globalClearance.mil) > 1e-6 || Math.abs(effectiveSettings.boardEdgeClearanceMil - ruleEvidence.boardEdgeClearance.mil) > 1e-6) return fail('RULE_VALUE_MISMATCH', 'Settings must exactly match the reported known rule evidence.')
		if (typeof input.inputDigest !== 'string' || !/^[0-9a-f]{64}$/i.test(input.inputDigest)) return fail('INVALID_INPUT_DIGEST', 'The collector inputDigest must be a SHA-256 hex digest.')
		const { runtimePath, runtime, patchReady } = await readRuntime()
		if (!runtime) return fail('RUNTIME_UNAVAILABLE', 'KiRouting runtime is not installed; info and explicit install are available.', { runtimePath })
		if (!patchReady) return fail('ADAPTER_PATCH_UNAVAILABLE', 'Routing requires every declared, hash-verified adapter patch in this runtime.')
		const job = { jobId: randomUUID(), type: 'route', operationId, target, mode: effectiveSettings.mode, state: 'queued', inputDigest: input.inputDigest, requestDigest, createdAt: new Date().toISOString(), runtime: { version: runtime.version, pythonVersion: runtime.pythonVersion, releaseSha256: runtime.releaseSha256, binarySha256: runtime.binarySha256, ...(effectiveSettings.mode === 'length-match' ? { adapterPatchRevision: runtime.adapterPatchRevision } : {}) } }
		jobs.set(job.jobId, job)
		await fs.mkdir(jobDir(job), { recursive: true })
		await fs.writeFile(path.join(jobDir(job), 'input.json'), JSON.stringify({ operationId, target, input: { ...input, target }, settings: effectiveSettings, inputDigest: input.inputDigest, runtime }, null, 2), 'utf8')
		await save(job)
		const env = { ...process.env, KICAD_NET_RESCUE: '0', KIROUTING_TOOL_DIRECTORY: runtime.toolDirectory }
		await launch(job, runtime.pythonExecutable, [runnerPath, '--job-dir', jobDir(job)], env)
		return { ok: true, data: await publicJob(job) }
	}
	async function status(params = {}, wantResult = false) {
		await init()
		const job = await locate(params.jobId, params.operationId, params.target)
		if (!job) return fail('JOB_NOT_FOUND', 'No persisted KiRouting job matches this identifier and target.')
		if ((params.jobId && job.jobId !== params.jobId) || (params.operationId && job.operationId !== params.operationId)) return fail('JOB_IDENTITY_MISMATCH', 'jobId and operationId resolve to different jobs.')
		if (job.type !== 'install' && params.target && !sameTarget(job.target, params.target)) return fail('TARGET_MISMATCH', 'Job target differs from requested target.')
		if (params.type === 'install' && job.type !== 'install') return fail('JOB_TYPE_MISMATCH', 'Requested job is not an installer job.')
		if (wantResult && job.state !== 'completed') return { ok: true, data: await publicJob(job) }
		if (wantResult && job.state === 'completed') {
			try {
				const envelope = JSON.parse(await fs.readFile(path.join(jobDir(job), 'result.json'), 'utf8'))
				if (job.type === 'route' && (envelope?.ok !== true || !envelope.result || envelope.result.schemaVersion !== 1 || envelope.result.units !== 'mil' || envelope.result.inputDigest !== job.inputDigest || !sameTarget(envelope.result.target, job.target) || envelope.result.existingCopperPreserved !== true || !Array.isArray(envelope.result.removedInputCopper) || envelope.result.removedInputCopper.length !== 0)) throw new Error('Canonical result failed identity/copper validation.')
			}
			catch { return fail('RESULT_UNAVAILABLE', 'The completed job result file is missing or invalid.') }
		}
		return { ok: true, data: await publicJob(job, wantResult) }
	}
	async function stop(params = {}) {
		await init()
		const job = await locate(params.jobId, params.operationId, params.target)
		if (!job) return fail('JOB_NOT_FOUND', 'No persisted KiRouting job matches this identifier and target.')
		if ((params.jobId && job.jobId !== params.jobId) || (params.operationId && job.operationId !== params.operationId)) return fail('JOB_IDENTITY_MISMATCH', 'jobId and operationId resolve to different jobs.')
		if (job.type !== 'install' && params.target && !sameTarget(job.target, params.target)) return fail('TARGET_MISMATCH', 'Job target differs from requested target.')
		if (!['running', 'queued', 'stopping'].includes(job.state)) return { ok: true, data: await publicJob(job) }
		const child = children.get(job.jobId)
		if (!child) { await save(job, { state: 'unknown' }); return { ok: true, data: await publicJob(job) } }
		await save(job, { state: 'stopping', stopRequested: true })
		if (process.platform === 'win32' && child.pid) {
			const root = process.env.SystemRoot ?? 'C:\\Windows'
			const taskkill = spawn(path.join(root, 'System32', 'taskkill.exe'), ['/PID', String(child.pid), '/T', '/F'], { shell: false, windowsHide: true, stdio: 'ignore' })
			taskkill.on('error', () => child.kill())
		} else child.kill()
		return { ok: true, data: await publicJob(job) }
	}
	async function list(params = {}) {
		await init()
		const entries = [...jobs.values()].filter(job => !params.target || job.type === 'install' || sameTarget(job.target, params.target)).map(job => ({ jobId: job.jobId, operationId: job.operationId, target: job.target, type: job.type, state: job.state, inputDigest: job.inputDigest }))
		return { ok: true, data: { jobs: entries } }
	}
	return { dispatch: async (action, params = {}) => {
		try {
			switch (action) {
				case 'info': return await info()
				case 'install': return await install(params)
				case 'start': return await start(params)
				case 'status': return await status(params)
				case 'stop': return await stop(params)
				case 'result': return await status(params, true)
				case 'list': return await list(params)
				default: return fail('UNKNOWN_ACTION', `Unsupported KiRouting action: ${String(action)}`)
			}
		} catch (error) { return fail('SERVICE_ERROR', cleanError(error)) }
	} }
}

export const kiRoutingProtocol = PROTOCOL
