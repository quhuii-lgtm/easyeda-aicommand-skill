import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

test('KiRouting HTTP dispatch advertises capability and checks browser origins before dispatch', async t => {
  const probe = net.createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const stateDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ace-kirouting-proxy-'))
  const script = fileURLToPath(new URL('../ai-command-engine/scripts/command-proxy.mjs', import.meta.url))
  const child = spawn(process.execPath, [script], {
    windowsHide: true, stdio: 'ignore',
    env: { ...process.env, PORT: String(port), AI_COMMAND_PROXY_DATA_DIR: stateDirectory, PROXY_IDLE_MS: '0' },
  })
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise(resolve => { child.once('exit', resolve); child.kill() })
    }
    await fs.rm(stateDirectory, { recursive: true, force: true })
  })
  const base = `http://127.0.0.1:${port}`
  let health
  for (let attempt = 0; attempt < 80; attempt++) {
    try { health = await fetch(`${base}/health`).then(r => r.json()); break }
    catch { if (child.exitCode !== null) break; await new Promise(resolve => setTimeout(resolve, 50)) }
  }
  assert.equal(health?.kiRoutingProtocol, 1, 'new proxy must start and advertise its endpoint')
  const request = (endpoint, body, origin, method = 'POST') => fetch(`${base}${endpoint}`, {
    method, headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  })
  for (const origin of ['https://untrusted.example', 'null']) {
    const response = await request('/kirouting', { action: 'install', params: { confirmed: true } }, origin)
    assert.equal(response.status, 403)
    assert.equal((await response.json()).ok, false)
    assert.equal((await request('/kirouting', {}, origin, 'OPTIONS')).status, 403)
    const typed = await request('/command', { cmd: 'macro', params: { steps: [{ cmd: 'pcb.kiRoutingInstall', params: { confirmed: true } }] } }, origin)
    assert.equal(typed.status, 403, 'typed/macro forwarding cannot bypass the local tool origin check')
  }
  const local = await request('/kirouting', { action: 'info', params: {} })
  assert.equal(local.status, 200)
  assert.equal((await local.json()).ok, true)
  const sdk = await request('/kirouting', { action: 'info', params: {} }, 'https://pro.lceda.cn')
  assert.equal(sdk.status, 200)
  assert.equal((await sdk.json()).ok, true)
  assert.equal((await request('/kirouting', {}, undefined, 'GET')).status, 405)
  const invalid = await fetch(`${base}/kirouting`, { method: 'POST', body: '{' })
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).error.code, 'INVALID_JSON')
  // Info and rejected requests must not create a runtime or start an installation.
  await assert.rejects(fs.stat(path.join(stateDirectory, 'tools', 'kirouting')))
})
