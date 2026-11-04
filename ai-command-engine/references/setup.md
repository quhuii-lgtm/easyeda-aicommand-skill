# Connection and Environment

## Install and Start in the Background

Install the EDA `.eext` and the complete `ai-command-engine` skill separately. The skill includes the proxy. The complete plugin source and a Windows URL registration are not required. Use Node.js >=20.17.0.

On first use, run `npm ci --omit=dev` in this skill's root directory to install its locked runtime dependency. After updating the skill, install from its new lockfile and preserve existing user settings.

Check `http://127.0.0.1:49720/health` before operating. If the proxy is stopped, the AI runs this through its terminal tool, replacing the placeholder with this skill's actual path:

```powershell
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "<skill-directory>/scripts/start-proxy.ps1"
```

The launcher runs Node hidden in the background, without a console window or a custom URL. It verifies service identity and reuses a compatible running proxy. Failures return a specific error. It does not stop unknown processes or silently change ports. Verify health, then check the EDA connection.

The enabled EDA plugin connects automatically, including when the proxy starts later. If the user stopped the bridge through the menu, ask them to choose Start Bridge to resume; do not bypass that pause.

A newly started proxy stores credentials, logs, and backups in `%LOCALAPPDATA%/ai-command-engine`, outside the skill folder. Updating the skill does not replace these files. A reused older proxy keeps its existing data directory; credentials are not migrated automatically. On macOS/Linux, use `node scripts/command-proxy.mjs` with the platform's background-launch facilities; those startup paths have not been verified in this update.

Development debug connection prompts refer to a different service. Normal use does not need an unrelated development server.

## Select an Instance and Document

1. Request `GET http://localhost:49720/health` and confirm `service:"ai-command-proxy"` and `lifecycleProtocol:1`.
2. Request `GET /connections` and select by project, document, and version. Do not rely only on `selected` or connection time.
3. Call `project.getInfo` to read the actual project and document UUID. To switch pages, call `editor.openDocument` explicitly.
4. Refresh the connection before each command and confirm the target is online. If the instance is paused, have the user resume it from the EDA menu; do not bypass the pause.

Send commands to `POST http://localhost:49720/command` with `Content-Type: application/json`:

```json
{"instanceId":"<verified instance>","cmd":"project.getInfo","params":{}}
```

```json
{"instanceId":"<verified instance>","cmd":"editor.openDocument","params":{"uuid":"<target document UUID>"}}
```

`instanceId` belongs at the top level, not inside `params`. Do not redirect a command to a different window when its target is offline.

`GET /help?cmd=<command>` uses the proxy's currently selected instance; check its version first. With multiple windows, call `__help` on the target instance. Do not guess parameters or compose SDK calls yourself.

## Units and Coordinates

| Object | Units and coordinates |
| --- | --- |
| Schematic and symbols | 1 unit = 10 mil; Y increases upward. Use the actual display and snap step; do not assume a default grid. |
| PCB and footprints | mil; 1 mm ≈ 39.37 mil; Y increases upward. |
| Schematic rectangle | Anchor at top left; `height` extends downward. |
| `pcb.drawOutline` | Public `x`/`y` coordinates refer to the lower-left corner. |
| Schematic source | Source Y has the opposite sign from API Y; verify when converting. |

Read the actual canvas size with `schematic.getPageInfo`; read the actual board outline for PCB work. Verify paper or board-size changes by reading the dimensions back.

## Target Checks and Tasks

`schematic.*` and `pcb.*` accept optional `__docUuid`. If supplied, it must be a non-empty string matching the focused page; omitting it operates on the currently identified page. A target-type or identity mismatch is rejected before the handler starts. The command does not switch pages implicitly, and this check does not guarantee the page stays unchanged during execution.

`_timeoutMs` sets the command wait budget. Invalid values or values beyond the runtime timer range are rejected; values below one second are treated as one second. Each macro step uses its own budget.

Commands that register tasks return a `taskId`. If the same task is still running, the response may include `alreadyRunning:true`; use `task.get` to check status or retrieve its result instead of resending changed parameters blindly. Completed tasks do not hold a long-term write lock. Deduplication and routing behavior vary by version; consult help on the target plugin.

## Timeouts and Recovery

- A client timeout does not cancel the underlying operation. Check `task.list`, `task.get`, and the target content before deciding what to do next.
- Inspect `error.message`, `partial`, failed items, and unprocessed items. Do not treat partial success as batch completion.
- Serialize writes per window. Long-running commands that support progress extend their deadline when valid progress arrives; connection ping/pong does not prove task progress.
- After reconnecting, reloading, or stopping and restarting, check the instance, project, and document again. An instance ID may stay the same or change.
- If the current request's result is unknown, stop dependent steps. An independently confirmed failure that has ended does not need a manual unlock.

## Upgrade and Connection Troubleshooting

Before upgrading, finish known operations and save. If a write is still unknown, inspect the current state first. After updating the extension and matching proxy, check the running process path, start time, and connected version.

The host health endpoint is `http://localhost:49720/health`. The local forwarding layer may wrap a connection failure in HTTP 500. First check whether a compatible service is already running; do not start another process just because of a 500 response.

Background timer throttling can delay timers; timer delay alone does not prove a disconnection. Only handle an old connection or exit an old process after confirming there are no in-flight tasks and completing a connection probe.
