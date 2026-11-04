import fs from 'node:fs';
import path from 'node:path';
import { Console } from 'node:console';
import { Writable } from 'node:stream';

// The hidden process owns its log handles instead of inheriting AI terminal pipes.
const state = process.env.AI_COMMAND_PROXY_DATA_DIR;
if (!state) throw Error('The background launcher must provide the data directory');
const out = fs.openSync(path.join(state, 'proxy-stdout.log'), 'w');
const err = fs.openSync(path.join(state, 'proxy-stderr.log'), 'w');
const stream = fd => new Writable({ write(chunk, encoding, callback) {
  try { fs.writeSync(fd, chunk); callback(); } catch (error) { callback(error); }
} });
globalThis.console = new Console({ stdout: stream(out), stderr: stream(err) });
process.once('exit', () => { fs.closeSync(out); fs.closeSync(err); });
try { await import('./command-proxy.mjs'); }
catch (error) { console.error(error.stack || error); process.exitCode = 1; }
