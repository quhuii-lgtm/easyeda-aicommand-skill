# PCB 4 · Autoroute and Import Results

Use `__help` in the target window for parameters, defaults, results, and examples.

## Start from the AI Command Engine menu

If the start reply is lost, query status from the original PCB tab to recover the bound job, then stop it if needed. Menu recovery checks this start operation, the original PCB and tab. If a runtime restart loses that binding, verify the service job ID before continuing.

- Start Autorouting preselects EDA-native routing. FreeRouting and KiRouting remain available. The selected job retains its engine. FreeRouting then checks its local service. If unavailable, choose AI-assisted setup and send the displayed request to a local AI, or choose manual setup to open the official instructions. Return to the menu after setup.
- Check or stop the bound job from the menu. Switch engines only after the previous job reports an end state. For an external engine, retrieve its result after completion, verify the target PCB, and confirm import separately. Inspect the resulting tracks and run DRC.

## Autorouting

Exclude crystal oscillator signal nets and their local branches from all autorouters. Build the selection from actual oscillator pins and net names. Start only when the engine can honor the exclusion. Keep the approved local ground guard, vias, and routing in place, and reject imported changes to this circuit.

- For EDA-native routing, select ordinary signal nets explicitly in the menu or pass an explicit `RoutingNets` list to `pcb.nativeAutoRouteStart`. Retain existing tracks and vias. With `pcb.nativeAutoRoute`, supply explicit target and ignored nets. Omitting the selection broadens the routing scope.
- Before starting KiRouting, verify the actual target nets for the selected mode, including the members of differential pairs, length-match groups, and fanout targets.
- The FreeRouting menu and `pcb.autoRouteStart` currently lack a net exclusion option. When a crystal circuit must be excluded, use a routing path that can apply the exclusion before starting.

When the user sends the setup request, check `http://127.0.0.1:37864/v1/system/status`. Reuse a healthy service. Otherwise check for an existing installation and install the platform package from the [official FreeRouting releases](https://github.com/freerouting/freerouting/releases) if needed.
Follow the [official self-hosting guide](https://github.com/freerouting/freerouting/blob/master/docs/self-hosting.md) to start it in the background with `--gui.enabled=false --api_server.enabled=true --api_server.authentication.enabled=false --api_server.endpoints=http://127.0.0.1:37864`. Use a hidden window on Windows.
Verify the status endpoint before telling the user to return to the menu. Report an occupied port without terminating the other service. With CLI only, export DSN, route externally, and import SES explicitly.

1. Use `pcb.exportDsn` for this run's input. Review rule comparison, conversion, and uncovered items. Preserve this run's `routeBaseline`.
2. Submit with `pcb.autoRouteStart` and record `jobId`. Use target help for settings; the plugin sends the nested FreeRouting fields and reads back effective values before starting. `maxThreads` controls the optimization phase; autorouter passes remain single-threaded. Check `routingSettings.readbackVerified`. If settings cannot be confirmed, use the `jobId` in the error to inspect or stop that job; do not resubmit. A verified settings readback does not prove that routing has started.
3. Poll with `pcb.autoRouteStatus`. `COMPLETED` means only that the service ended. Check unrouted and violation reports; do not replace missing fields with zero.
4. Retrieve original SES with `pcb.autoRouteGetResult`. Status and retrieval do not write to the board.
5. Explicitly call `pcb.importAutoRouteSes` with original `fileName` and `base64`. For an existing ARC protection path, also pass the matching `routeBaseline`; it may be omitted for ordinary SES without such paths. Do not replace the original record with a later export.
6. Check new objects, preservation of existing routes, and repeated-import results. Run target DRC; save and reopen when needed.

## EDA-native autorouting

- `pcb.nativeAutoRoute` is an optional EDA-native method; use it after the user selects it.
- Check the read-only `dryRun:true` result and use `__help` for network, layer, and option details; `RoutingNets` has a capital R.
- `existingPrimitiveMode` defaults to `keep`; use `remove` only when explicitly selected.
- Execute with `dryRun:false`; query long tasks by returned `taskId` with `task.get`.
- On timeout or unknown result, inspect the task and PCB before proceeding; do not resend or promise cancellation.
- Read back routes, nets, and layers, then check connectivity, DRC, saving, and reopen persistence.
- Keep the EDA-native, FreeRouting, and KiRouting flows separate.

### EDA-native background jobs

In the PCB tools menu, accept the EDA-native default and select the networks to route. EDA writes the result to the current board. Use the status and stop actions for that job. The result action shows the job log. Use the commands below for the same workflow through the API.

1. Start with an explicit `RoutingNets` list and `existingPrimitiveMode: "keep"`. Retain the returned `jobId` and its `binding` fields.
   The plugin automatically excludes other named nets. On older versions, explicitly provide the other named nets in `ignoreNets`.
2. Query `pcb.nativeAutoRouteStatus` with the returned `jobId`, `projectUuid`, and `pcbUuid` from the same PCB page session.
3. When the task is complete, call `pcb.nativeAutoRouteLog` with the same binding and inspect its `logs`, `result`, and `progress` snapshot. Read back the routed objects and affected nets and layers.
4. Run the applicable DRC, then save and verify persistence as required for the change.

To cancel, call `pcb.nativeAutoRouteStop`, then query status until the native state is `canceled`. An accepted stop request does not mean the task has stopped. If a page refresh makes the job status `unknown`, do not start another job; inspect the current PCB and preserve the unknown result.

## KiRouting menu workflow

KiRouting is an optional external engine. Open the PCB tools menu and choose KiRouting for a new KiRouting job. Later status, stop, result, and import actions stay bound to the engine, job, PCB, project, and tab selected at start.

On first use, query `pcb.kiRoutingInfo`. If the runtime is missing, choose the menu's AI-assisted installation or manual setup. Choosing AI-assisted installation submits the stated local runtime setup; check the returned install job until it finishes, then query `pcb.kiRoutingInfo` again. Opening the menu or checking status does not install or download anything.

Before starting, read `supportedModes` and its settings schema from `pcb.kiRoutingInfo`, then use `__help` for the command parameters. Select only a mode the current runtime reports. Send `pcb.kiRoutingStart` with an explicit `operationId`, target PCB, mode settings, and `keep_input_copper:true`. Start only reads the PCB and submits a local job; it does not write routes to EDA.

Use `pcb.exportKiRouting` to inspect the supported input and rule coverage before starting. To recover a lost job identifier, use `pcb.kiRoutingList` from its original PCB, project, and tab.

Use the menu or `pcb.kiRoutingStatus` to check the same operation. If the start reply is lost, query it with the original operation ID and target. Stop only that job. Retrieve the completed result with `pcb.kiRoutingGetResult`; it returns canonical KiRouting JSON and does not modify EDA.

Keep existing copper during routing. Supported foreign-net copper fills are passed to the router as obstacles on the original layer, with holes retained. If coverage or conversion is incomplete, check the reported copper object before routing.

Review the result and target, then call `pcb.importKiRoutingResult` with its default read-only preview. Import only after reviewing the preview and explicitly confirming `dryRun:false`. The importer checks the source baseline, input copper preservation, output coverage, target networks, layers, and known width rules before using the existing append writer. It does not delete existing routes. After import, inspect added objects and connectivity, run DRC, then save and reopen to verify persistence.

Use only fields reported for the selected mode. A listed mode confirms interface availability, not that a board meets its routing constraints; inspect the produced geometry and reports. Unsupported inputs are reported and may prevent the job from starting; do not assume they were routed. Simple closed, straight-edged, single-ring `POLYGON` copper pads retain their global mil outline. Multi-ring, curved, or hole-containing polygon pads are not converted. Do not substitute guessed defaults, change nets, or reduce widths to force a route.

- Fanout currently offers QFN/QFP escape; BGA is unavailable. Dense fanout may complete only part of the selection. Inspect `failedNets` and `candidateRejections` before previewing or importing accepted candidates. Partial fanout still needs follow-up routing and native DRC; do not accept DRC violations.
- Judge length matching from measured final route geometry and the explicitly requested tolerance. Treat unresolved endpoint paths or existing branched copper as unverified. Already routed paths are not automatically tuned. A completed job is not board acceptance.
- The pinned KiRouting 0.18 runtime supports through vias only; blind and buried vias are unavailable. A successful job or import is not proof of full routing, rule compliance, DRC, or persistence.
- Complex boards may remain partly routed. Inspect unfinished networks and use the EDA-native tools or FreeRouting for follow-up work. A result rejected by geometry or rule checks is not imported.
- Preview applies the existing minimum of 1 mil per SES segment. Results with shorter segments remain retrievable but cannot be imported unchanged; do not merge or remove segments to bypass the check.

Enable layer-width conversion only when needed and review the conversion report. Verify unknown or conflicting rule sources. An incomplete constraints check cannot establish full compliance.

DSN width comparison and conversion apply only when TRACK fields, units from the current rule snapshot, enabled copper layers, and source/SDK bindings are confirmed. Display labels such as `mm` or `mil` alone do not establish a conversion; do not calculate from the label alone. Other checks for via settings, differential rules, thermal relief on single-layer SMT pads, bottom mask/paste, and via-mask output are separate results; they do not prove those fields are mapped into DSN. Complex class or differential structures with `globalStatus:unknown` remain unknown and retain all-or-nothing rejection. Do not substitute defaults or partially apply them to make the check pass.

SES often lacks reliable drill diameter. For exact import, provide the current drill using `viaHoleDiametersMil`; do not infer it from via copper diameter. `widthRuleCompliance` distinguishes known violations from unknown rules: violations reject before writing; unknown does not mean pass.

Deduplication of existing ARC polylines occurs only when the corresponding source record can be confirmed. Import does not silently quantize original coordinates, merge short segments, or change nets to pass checks. Treat unverifiable cases as errors. Use `__help` on the target window to inspect supported response fields.

Do not start another autoroute while an existing task is running or has unknown status. Query or stop it according to current help; do not assume it was cancelled.

Retry only when an explicit connection check confirms the start request was not sent. If the request was submitted, timed out after partial progress, or its response is unknown, keep this operation's marker and query or stop it first; do not start a duplicate job. This is a handling rule, not a claim that the failure was reproduced in EDA.

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
| EDA-native autorouting | `pcb.nativeAutoRoute`, `task.get` | Optionally inspect scope or run native routing; query long tasks by ID and independently read back, check DRC, and verify persistence. |
| EDA-native background routing | `pcb.nativeAutoRouteStart`, `pcb.nativeAutoRouteStatus`, `pcb.nativeAutoRouteLog`, `pcb.nativeAutoRouteStop` | Start with explicit target nets, then check status and logs in the original page session. Stop requests require a status readback. |
| KiRouting | `pcb.kiRoutingInfo`, `pcb.kiRoutingInstall`, `pcb.exportKiRouting`, `pcb.kiRoutingList`, `pcb.kiRoutingStart`, `pcb.kiRoutingStatus`, `pcb.kiRoutingStop`, `pcb.kiRoutingGetResult`, `pcb.importKiRoutingResult` | Inspect input coverage, optionally install and run the local engine, recover or inspect its job, then explicitly preview and import the result. |
