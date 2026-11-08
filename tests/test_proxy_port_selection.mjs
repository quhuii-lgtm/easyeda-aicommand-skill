import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = path.dirname(fileURLToPath(import.meta.url))
const skillProxy = path.join(here, '..', 'ai-command-engine', 'scripts', 'command-proxy.mjs')
const mirrorProxy = path.join(here, '..', '..', 'repository', 'bridge', 'command-proxy.mjs')

function sourceFunctions(source) {
	const describe = source.match(/function describeListenError\(port, error\) \{[\s\S]*?\n\}/)?.[0]
	const start = source.match(/async function startServer\(\) \{[\s\S]*?\n\}/)?.[0]
	assert.ok(describe, 'describeListenError must exist in the proxy source')
	assert.ok(start, 'startServer must exist in the proxy source')
	return `${describe}\n${start}\nthis.startServer = startServer`
}

async function exerciseSource(filename, requestedPort, bindResult) {
	const source = fs.readFileSync(filename, 'utf8')
	const ports = []
	const context = {
		PORT: requestedPort,
		DEFAULT_PORT_START: 49720,
		DEFAULT_PORT_END: 49729,
		startOnPort: async port => {
			ports.push(port)
			const result = await bindResult(port)
			if (result instanceof Error)
				throw result
		},
	}
	vm.runInNewContext(sourceFunctions(source), context, { filename })
	try {
		await context.startServer()
		return { ports, error: null }
	}
	catch (error) {
		return { ports, error: String(error?.message ?? error) }
	}
}

function bindError(code, port, errno = -4092) {
	const error = new Error(`listen ${code}: 127.0.0.1:${port}`)
	error.code = code
	error.errno = errno
	error.syscall = 'listen'
	return error
}

for (const filename of [skillProxy, mirrorProxy]) {
	const eaccesFallback = await exerciseSource(filename, null, async port =>
		port === 49720 ? bindError('EACCES', port) : undefined)
	assert.deepEqual(eaccesFallback.ports, [49720, 49721], `${path.basename(path.dirname(filename))}: EACCES falls through`)
	assert.equal(eaccesFallback.error, null)

	const addressFallback = await exerciseSource(filename, null, async port =>
		port === 49720 ? bindError('EADDRINUSE', port, -4091) : undefined)
	assert.deepEqual(addressFallback.ports, [49720, 49721])
	assert.equal(addressFallback.error, null)

	const unexpected = await exerciseSource(filename, null, async port => bindError('EINVAL', port, -22))
	assert.deepEqual(unexpected.ports, [49720], 'unexpected bind errors stop immediately')
	assert.match(unexpected.error, /code=EINVAL/)

	const exhausted = await exerciseSource(filename, null, async port =>
		bindError(port % 2 ? 'EADDRINUSE' : 'EACCES', port, port % 2 ? -4091 : -4092))
	assert.deepEqual(exhausted.ports, Array.from({ length: 10 }, (_, index) => 49720 + index))
	assert.match(exhausted.error, /port=49720 code=EACCES errno=-4092/)
	assert.match(exhausted.error, /port=49721 code=EADDRINUSE errno=-4091/)
	assert.match(exhausted.error, /port=49729 code=EADDRINUSE errno=-4091/)

	const explicit = await exerciseSource(filename, 49724, async port => bindError('EACCES', port))
	assert.deepEqual(explicit.ports, [49724], 'explicit PORT does not fail over')
	assert.match(explicit.error, /port=49724 code=EACCES errno=-4092/)
}

// Use a real occupied loopback port to verify the WebSocketServer's forwarded
// server error is handled and reaches the explicit-port error path without throw.
const blocker = http.createServer()
await new Promise((resolve, reject) => blocker.listen(0, '127.0.0.1', error => error ? reject(error) : resolve()))
const occupiedPort = blocker.address().port
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-bind-regression-'))
const child = spawn(process.execPath, [skillProxy], {
	cwd: path.dirname(path.dirname(skillProxy)),
	env: { ...process.env, PORT: String(occupiedPort), AI_COMMAND_PROXY_DATA_DIR: tempDir },
	windowsHide: true,
	stdio: ['ignore', 'pipe', 'pipe'],
})
let output = ''
child.stdout.setEncoding('utf8').on('data', chunk => output += chunk)
child.stderr.setEncoding('utf8').on('data', chunk => output += chunk)
let exitCode
try {
	exitCode = await new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			child.kill()
			reject(new Error(`proxy failed to exit after bind error; output=${output}`))
		}, 8000)
		child.once('error', error => { clearTimeout(timer); reject(error) })
		child.once('exit', code => { clearTimeout(timer); resolve(code) })
	})
}
finally {
	if (child.exitCode === null)
		child.kill()
	await new Promise(resolve => blocker.close(resolve))
	const tempRoot = fs.realpathSync(os.tmpdir())
	const tempRealPath = fs.realpathSync(tempDir)
	assert.equal(path.dirname(tempRealPath), tempRoot, 'test temp directory must remain directly under os.tmpdir()')
	assert.match(path.basename(tempRealPath), /^proxy-bind-regression-/)
	fs.rmSync(tempRealPath, { recursive: true, force: true })
}
assert.equal(exitCode, 1)
assert.match(output, /code=EADDRINUSE/)
assert.match(output, new RegExp(`port=${occupiedPort}`))

console.log('proxy port-selection tests passed: 10 injected cases across both proxy sources + 1 real WebSocket bind-conflict case')
