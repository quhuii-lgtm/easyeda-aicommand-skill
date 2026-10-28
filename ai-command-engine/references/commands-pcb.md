# PCB Workflow

Before the first PCB write, read [PCB operating requirements](PCB操作要求.md) and this page in full. Follow its [required operation order](PCB操作要求.md#required-operation-order), [optional tool offer rules](PCB操作要求.md#pcb-optional-tools), and [completion checks](PCB操作要求.md#pcb-completion-checks). Use this page for execution details and indexes for command names; use the target plugin version's help for parameters.

## Read the design and current board

The user initiates and confirms schematic-to-PCB updates in EDA. AI does not call `pcb.importChanges` or the official import API. Read components, footprint links, pad nets, and non-target objects before and after an update; a sync request is not proof that sync completed.

Use `pcb.listComponents`, `pcb.getComponentPads`, `pcb.listNets`, and `pcb.listLayers` to inspect the active board. Get object IDs from the current PCB; do not reuse IDs from screenshots or another project. Check pad-array indexes (one-based) separately from runtime IDs.

## Outline, layers, and placement

- `pcb.drawOutline` uses lower-left coordinates and dimensions in mil. Before drawing another outline, inspect existing primitive types and IDs.
- `pcb.setCopperLayers` sets copper-layer count but does not configure physical stackup. Read back after applying a stackup; a default stackup is not proof it is applied to the current PCB.
- Use layer names and numbers from current help. Do not guess unknown names; confirm inner layers are available on this board.
- After `pcb.moveComponent`, verify position, angle, side, and lock state. `pcb.checkPlacement` uses readable pad boundaries; skipped or unsupported objects do not count as a pass.
- When schematic import/update has been read back and sources are verifiable, offer grouping by functional region if the user has not already chosen. Reuse an explicit choice; do not execute without a reply. If selected, review `dryRun`, board fit, and size sources before execution. See [optional tool offer rules](PCB操作要求.md#pcb-optional-tools).

## Routing and vias

`pcb.routeTrack` creates segments in order from `points:[[x,y],...]`. The net must exist; select `width` and `currentA` from current help. Coordinates and width use mil; each adjacent segment must be at least 1 mil under the plugin's current input policy. This is not a general SDK limit.

Choose `top`, `bottom`, or the actual layer number. Versions with name mapping may also accept aliases such as `inner1`; older versions require numeric inner-layer IDs. Name resolution alone does not prove that a layer is enabled, writable, or electrically valid.

For `pcb.placeVia`, specify net, coordinates, copper diameter, and drill; drill must be smaller than copper diameter. A via is not an NPTH mounting hole. Use `pcb.placePad` or `pcb.placeHole` for standalone pads and mounting holes; specify hole type, copper, and solder mask according to current help.

A creation receipt or ID alone does not prove success. Read back net, layer, endpoints, width, drill, and preservation of original objects. `connectivityVerified:false` means connectivity was not confirmed. Acceptance of a ratsnest calculation request is not a substitute for target DRC.

If segmented routing returns `partial`, inspect written segments before proceeding; do not replay the full path. Do not delete routes, rebuild, or save/reopen merely to clear a connectivity report; those operations need a clear purpose and authorization.

## Fanout, differential pairs, and length tuning

Use `pcb.getFanoutPlan`, inspect target, dimensions, obstacles, and `executable`, then pass the complete plan to `pcb.fanout`. If a plan is stale, generate a new one; do not modify its proof fields.

Use `pcb.routeDiffPair` for a specified differential path, `pcb.tuneLength` for tuning, and `pcb.routePadBranches` for repeated-pad branches. These commands do not perform arbitrary whole-board avoidance or impedance design. See [PCB special topics](commands-pcb-special.md) for supported inputs and results.

## Autorouting

The plugin uses an already-running FreeRouting REST service and has no launcher. With CLI only, use export DSN → external CLI → explicit SES import. A running process does not prove the REST service is reachable.

1. Use `pcb.exportDsn` for this run's input. Review rule comparison, conversion, and uncovered items. Preserve this run's `routeBaseline`.
2. Submit with `pcb.autoRouteStart` and record `jobId`. Set parameters for the current board. `maxPasses` is a positive integer; `automaticNeckdown` defaults to `false`.
3. Poll with `pcb.autoRouteStatus`. `COMPLETED` means only that the service ended. Check unrouted and violation reports; do not replace missing fields with zero.
4. Retrieve original SES with `pcb.autoRouteGetResult`. Status and retrieval do not write to the board.
5. Explicitly call `pcb.importAutoRouteSes` with original `fileName` and `base64`. For an existing ARC protection path, also pass the matching `routeBaseline`; it may be omitted for ordinary SES without such paths. Do not replace the original record with a later export.
6. Check new objects, preservation of existing routes, and repeated-import results. Run target DRC; save and reopen when needed.

`applyLayerWidthRules` defaults to `false`. When explicitly `true`, it converts only layer widths that can be reliably confirmed and reports changes; unknown, conflicting, or changed sources reject conversion. It does not modify EDA rules. `routingConstraintsComplete:false` means the rules check is incomplete.

SES often lacks reliable drill diameter. For exact import, provide the current drill using `viaHoleDiametersMil`; do not infer it from via copper diameter. `widthRuleCompliance` distinguishes known violations from unknown rules: violations reject before writing; unknown does not mean pass.

Deduplication of existing ARC polylines occurs only when the corresponding source record can be confirmed. Import does not silently quantize original coordinates, merge short segments, or change nets to pass checks. Treat unverifiable cases as errors. See [PCB special topics](commands-pcb-special.md) for response fields.

Do not start another autoroute while an existing task is running or has unknown status. Query or stop it according to current help; do not assume it was cancelled.

## Copper and silkscreen

`pcb.pourCopper` creates a copper boundary. Use `pcb.rebuildPour` and inspect actual fill; use `pcb.getPourFillReadback` if needed. `no-fill` does not mean a completed pour, and a boundary is not interchangeable with fixed copper `fill`.

Do not use `pcb.modifyPour` to change the net or name of an existing pour. If necessary, edit in EDA, then rebuild and verify; do not present automated delete-and-recreate as a lossless edit.

Use `pcb.modifyComponentAttribute` to adjust designator position, angle, font, or visibility. Use `pcb.placeString` and `pcb.modifyString` for ordinary text. Check mirroring and readability for bottom-side text.

`pcb.checkSilkscreen` is read-only and checks text, designators, available package silkscreen, pad openings, and board edge. Judge manufacturing-geometry conflicts separately from source-object candidates. Report unique-source attribution, ambiguous matches, and uncovered primitives as returned; a candidate is not a confirmed conflict. See [PCB special topics](commands-pcb-special.md) for parameters and coverage.

## Checks, save, and manufacturing exports

1. Use `pcb.runDrcDetailed` to locate issues by object, net, rule, and layer; do not rely on totals alone.
2. Use `pcb.runDfm`, `pcb.runSmtDfm`, and `pcb.checkManufacturingProfile` as required. Profile data needs sources; verify actual manufacturer stackup, calculations, and order separately.
3. After `pcb.save`, check the result. Follow the [save and reopen scope](PCB操作要求.md#save-and-reopen-scope): local changes generally need target/affected/non-target readback and save; whole-board delivery or listed persistence-sensitive changes require reopening the affected PCB.
4. Export Gerber, BOM, placement data, or netlist as needed. Check units, layers, holes, and component information using [production file requirements](生产文件操作要求.md).

DRC, manufacturing geometry checks, and production-order consistency are separate conclusions. If project manufacturing data is missing, do not guess board thickness, copper weight, Dk, or impedance parameters.
