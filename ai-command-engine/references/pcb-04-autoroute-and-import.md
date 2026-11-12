# PCB 4 · Autoroute and Import SES

Use `__help` in the target window for parameters, defaults, results, and examples.

## Start from the AI Command Engine menu

If the start reply is lost, query status from the original PCB tab to recover the bound job, then stop it if needed. Menu recovery checks this start operation, the original PCB and tab. If a runtime restart loses that binding, verify the service job ID before continuing.

- Start Autorouting checks the local FreeRouting service. If unavailable, choose AI-assisted setup and send the displayed request to a local AI, or choose manual setup to open the official instructions. Return to the menu after setup.
- Check the job status or stop the job from the menu. After completion, retrieve the SES, check the target PCB, and confirm import separately. Inspect the resulting tracks and run DRC after importing.

## Autorouting

When the user sends the setup request, check `http://127.0.0.1:37864/v1/system/status`. Reuse a healthy service. Otherwise check for an existing installation and install the platform package from the [official FreeRouting releases](https://github.com/freerouting/freerouting/releases) if needed.
Follow the [official self-hosting guide](https://github.com/freerouting/freerouting/blob/master/docs/self-hosting.md) to start it in the background with `--gui.enabled=false --api_server.enabled=true --api_server.authentication.enabled=false --api_server.endpoints=http://127.0.0.1:37864`. Use a hidden window on Windows.
Verify the status endpoint before telling the user to return to the menu. Report an occupied port without terminating the other service. With CLI only, export DSN, route externally, and import SES explicitly.

1. Use `pcb.exportDsn` for this run's input. Review rule comparison, conversion, and uncovered items. Preserve this run's `routeBaseline`.
2. Submit with `pcb.autoRouteStart` and record `jobId`. Use target help to configure it for the current board.
3. Poll with `pcb.autoRouteStatus`. `COMPLETED` means only that the service ended. Check unrouted and violation reports; do not replace missing fields with zero.
4. Retrieve original SES with `pcb.autoRouteGetResult`. Status and retrieval do not write to the board.
5. Explicitly call `pcb.importAutoRouteSes` with original `fileName` and `base64`. For an existing ARC protection path, also pass the matching `routeBaseline`; it may be omitted for ordinary SES without such paths. Do not replace the original record with a later export.
6. Check new objects, preservation of existing routes, and repeated-import results. Run target DRC; save and reopen when needed.

Enable layer-width conversion only when needed and review the conversion report. Verify unknown or conflicting rule sources. An incomplete constraints check cannot establish full compliance.

Track-width support is determined by TRACK fields, units, enabled copper layers, and matching source/SDK rule bindings, without a host-version allowlist. Unknown or conflicting structures report the specific reason.

SES often lacks reliable drill diameter. For exact import, provide the current drill using `viaHoleDiametersMil`; do not infer it from via copper diameter. `widthRuleCompliance` distinguishes known violations from unknown rules: violations reject before writing; unknown does not mean pass.

Deduplication of existing ARC polylines occurs only when the corresponding source record can be confirmed. Import does not silently quantize original coordinates, merge short segments, or change nets to pass checks. Treat unverifiable cases as errors. See [PCB special topics](pcb-04-autoroute-and-import.md) for response fields.

Do not start another autoroute while an existing task is running or has unknown status. Query or stop it according to current help; do not assume it was cancelled.

## DSN/SES autorouting

The flow is DSN export, service start, status polling, SES retrieval, import-condition checks, SES import, and independent PCB checks. Confirm parameters at each step. Keep the `jobId` from `pcb.autoRouteStart`; poll with `pcb.autoRouteStatus {jobId}`. After `COMPLETED`, call `pcb.autoRouteGetResult {jobId}` for `fileName` and `base64`. Status polling may clear the recent task, so retrieval must explicitly pass `jobId`.

At retrieval, check job identity, file format, Base64, UTF-8, and supported SES structure. Do not alter short segments, coordinates, widths, or drill sizes in the original. Read-only retrieval may be repeated. `COMPLETED` does not mean fully routed; inspect unrouted and violation statistics, and do not interpret missing/empty statistics as zero. Retrieval does not import, delete, save, or run DRC. The service filename is a result filename, not a local path.

Only call `pcb.importAutoRouteSes` after verifying current PCB, net rules, and routing input. Pass original filename, Base64, and required parameters such as drill diameter. Import checks are separate; segments below 1 mil can be preserved at retrieval but are rejected by import rules and are not auto-merged. After import, independently inspect new geometry, nets, layers, rules, and connectivity; save/reopen and run DRC as needed. Service completion, SES counts, or a local check do not prove board-wide routing.

When SES may contain protected existing ARC paths, preserve the `routeBaseline` object returned by pre-routing `pcb.exportDsn` unchanged and use it with that DSN and job. It must match the DSN actually sent to the router; a later export cannot prove the ARC stayed unchanged during routing. Do not use a baseline with `routeBaseline.status` set to `incomplete`, changed PCB identity/source, or an imprecise protected-wire match to resolve SES paths. If a possible existing ARC protection path is present and baseline is absent, import must reject before writing. SES without such paths can follow the regular help-supported path.

ARC protection matching is limited: check current valid ARC source against the actual DSN and check SES wire type, net, layer, width, and complete point list. Duplicate or split-path checks compare only tracks on the same layer and net. Tracks on another layer or net follow normal track checks; coincident coordinates alone do not make them duplicate ARC protection paths. Split paths, added/missing points, duplicates, edits, changed source, or missing source are not a protected match. A multi-path wire that may mix old protected paths and new routing is rejected before writing. Keep the source file and inspect inputs after rejection; do not edit SES to bypass checks. Successful import confirms only supported writes and geometry checks, not complete rules, board-wide connectivity, or DRC.

Read every `unknowns` item in rule-conformance results; it means neither violation nor pass. Net-class inheritance, empty selectors, and unsupported rules may remain unknown. Check differences between DSN default width and EDA preferred rules separately. `routingConstraintsComplete:false` means the constraint check is incomplete; router success does not prove constraints were satisfied.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Autorouting and import | `pcb.autoRouteStart`, `pcb.autoRouteStatus`, `pcb.autoRouteGetResult`, `pcb.autoRouteStop`, `pcb.exportDsn`, `pcb.importAutoRouteSes` | Start/check routing, export DSN, and import SES. Retrieving a result does not import it; verify target board and source before import. |
