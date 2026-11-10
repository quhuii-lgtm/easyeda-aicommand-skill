# PCB 3 · Route and Tune

Use `__help` in the target window for parameters, defaults, results, and examples.

## Plan Routing Paths

- Route critical loops and the hardest pin exits first.
- Before routing, trial-route or inspect real geometry for constrained exits and shared corridors. Use actual pads, layers, widths, clearances, vias, and obstacles on all layers.
- No component overlap does not prove the board is routable. A trial covers only the checked scope; record predicted paths separately from completed routes.
- Shared corridors must fit all related traces at once; do not count the same space repeatedly as each individual trace passes.
- Plan exits from both ends, main corridors, branches, layer changes, and returns. Reserve exits for unrouted pins, power, and ground too.
- Do not change IC pin assignment or connector pin order solely to make routing look orderly.
- For a simple straight corridor, estimate width from trace widths, clearances, and side margins. Calculate additional space separately for bends, branches, vias, and returns.
- Do not require horizontal routing on the top layer or vertical routing on the bottom layer.

## Power, Signals, and Sensing

- Trace each current path from supply to load and back. Check components, connectors, pads, narrow copper, via groups, and planes.
- Check current, voltage drop, loss, and temperature rise under actual operating conditions. Identify loops with rapidly changing current by switching state.
- Follow IC requirements for switch nodes, gates, and bootstrap loops. A large copper area does not replace path analysis.
- Evaluate communication traces against transceiver, edge rate, load, protocol, and cable. Determine differential impedance and timing from the actual interface and stackup.
- Measure paths from source to each receiver. Total net copper length does not replace endpoint path or timing-skew checks.
- Check every required pin on multi-pin same-net connectors. Check bidirectional buses for their actual driver states and choose branch topology for the interface and load.
- Do not add serpentine length to ordinary control or PWM traces when there is no length-matching requirement.
- Route sense positive and negative from the actual sense locations. Do not include a power-drop segment that must not be shared in a sense path.

## Record High-Current Paths by Segment

- Record each connector, trace or plane, component pad, via group, and return path in connection order.
- For every segment, state continuous current, peak current, and the duration of each.
- Record the narrowest location, actual dimensions, and copper thickness for each segment.
- For via groups, record drill diameter, via count, plated barrel thickness, and connection method. Distinguish drill diameter from finished-hole diameter.
- Mark missing parameters pending; do not fill them with tool defaults.
- Record the basis and pending checks for ampacity, voltage drop, and temperature rise per segment.
- Outer-layer copper thickness does not specify via barrel plating. Via count alone does not prove via-group current capacity or temperature rise.
- A large copper pour or zero DRC errors alone does not prove current capacity. Part-specific thermal-via guidance is maintained in `component-pcb-profiles`.

## Rerouting and Comparison

- State which components may move, which traces may change, and which connections must remain.
- For one pin-exit problem, adjust locally first. If a shared corridor is constrained, check the whole related functional group.
- If routing repeatedly detours around the same obstacle, inspect the placement cause first.
- After deletion or shove routing, inspect segments, clipping, neighboring traces, and endpoints outside the edited area.
- Compare alternatives with identical endpoints, operating conditions, and scope. Record route, layer changes, returns, and neighboring impacts for all affected interfaces.
- Failing to find a better route does not prove a layer change is necessary. Shorter routing or fewer vias do not offset electrical, mechanical, or manufacturing problems.

## Routing and vias

`pcb.routeTrack` creates segments in order from `points:[[x,y],...]`. The net must exist; select `width` and `currentA` from current help. Coordinates and width use mil; each adjacent segment must be at least 1 mil under the plugin's current input policy. This is not a general SDK limit.

Choose `top`, `bottom`, or the actual layer number. Versions with name mapping may also accept aliases such as `inner1`; older versions require numeric inner-layer IDs. Name resolution alone does not prove that a layer is enabled, writable, or electrically valid.

For `pcb.placeVia`, specify net, coordinates, copper diameter, and drill; drill must be smaller than copper diameter. A via is not an NPTH mounting hole. Use `pcb.placePad` or `pcb.placeHole` for standalone pads and mounting holes; specify hole type, copper, and solder mask according to current help.

A creation receipt or ID alone does not prove success. Read back net, layer, endpoints, width, drill, and preservation of original objects. `connectivityVerified:false` means connectivity was not confirmed. Acceptance of a ratsnest calculation request is not a substitute for target DRC.

If segmented routing returns `partial`, inspect written segments before proceeding; do not replay the full path. Do not delete routes, rebuild, or save/reopen merely to clear a connectivity report; those operations need a clear purpose and authorization.

## Fanout, differential pairs, and length tuning

Use `pcb.getFanoutPlan`, inspect target, dimensions, obstacles, and `executable`, then pass the complete plan to `pcb.fanout`. If a plan is stale, generate a new one; do not modify its proof fields.

Use `pcb.routeDiffPair` for a specified differential path, `pcb.tuneLength` for tuning, and `pcb.routePadBranches` for repeated-pad branches. These commands do not perform arbitrary whole-board avoidance or impedance design. See [PCB special topics](pcb-03-route-and-tune.md) for supported inputs and results.

## Plan-based geometry

Use a read-only plan, execute that exact plan, then read back for fanout, local copper, pad expansion, and net-label silkscreen. Read actual primitive IDs from the active PCB; designators, pad numbers, and net names are not primitive IDs. Check plan `executable`, targets, nets, layers, geometry, `coverage`, and `warnings`. Do not write an unexecutable plan; assess whether missing coverage affects the target before proceeding.

Pass the complete plan `data` unchanged as `params.plan`. Do not edit or reconstruct its fields. Check created objects, nets, layers, and geometry after execution. If partially failed, preserve created objects and inspect the board; do not replay the old plan. These commands do not run whole-board DRC, save, or manufacturing acceptance. Confirm persistence by saving and reopening when required. Copper operations share an SDK timeout; a timeout does not cancel the host operation. If the result is unknown, stop dependent writes and do not repeat it.

| Operation | Plan → execute | Scope |
| --- | --- | --- |
| Fine-pitch fanout | `pcb.getFanoutPlan` → `pcb.fanout` | Routes target pads to escape vias; does not complete the whole net. |
| Local copper | `pcb.getAutoCopperPlan` → `pcb.autoCopper` | `pour` creates a rules-clipped copper boundary; `fill` creates fixed copper geometry. They are different. |
| Pad expansion | `pcb.getPadExpansionPlan` → `pcb.expandPads` | Creates copper/fill exclusion or solder-mask regions; does not resize pad copper. |
| Net silkscreen | `pcb.getNetSilkscreenPlan` → `pcb.generateNetSilkscreen` | Creates editable text, not an electrical connection. Check legibility and spacing to pads, outline, and text. |

### Fanout and local copper

Fanout targets may be selected by component, pad, or net, but IDs must come from the current PCB. Explicitly provide trace width, via copper diameter, drill, escape length, and spacing in mil; drill must be smaller than via copper diameter. Select top or bottom escape for multilayer or through-hole pads. Current fanout creates through vias, not blind or buried vias. If the outline, obstacles, pad shape, or rules cannot be parsed safely, the plan must be unexecutable. Completed fanout only covers planned pad escapes; it does not prove net connectivity, DRC, or manufacturability.

Local copper plans are grouped by net and copper layer and do not merge different nets. Current outline parsing supports only a verified single closed loop; curves, multiple loops, or incomplete obstacle data make partial geometry unsafe. A `pour` may be clipped to its boundary or have no fill. After create/rebuild, `pcb.getPourFillReadback` can inspect fill objects, parent boundary, net, and layer. A non-empty path is not proof of correct geometry or manufacturability. If execution or fill readback is unknown, preserve the boundary and inspect the board; do not rebuild or delete automatically. `executable:true` permits execution under plan checks but does not guarantee host fill generation.

New pours can specify a net; automated net/name changes for existing pours are unsupported. For manual EDA edits, verify pour order, rebuild, and actual fill. Do not describe delete-and-recreate as a lossless net change.

Pad expansion supports only shapes covered by the plan. Curved outlines may be approximations; retain the full planned contours and fragments. Verify solder-mask expansion in production outputs. Net silkscreen is text only; check pad net, text layer, rotation, bottom-layer mirroring, and visual spacing after execution.

## Net rules, differential routing, and length tuning

`pcb.createNetClass`, `pcb.renameNetClass`, and `pcb.deleteNetClass` manage net classes; `pcb.listNetClasses` reads them; `pcb.addNetToClass` adds a net. Check current help for member removal. `pcb.createDiffPair` and `pcb.listDiffPairs` create/list pairs; check help for deletion. `pcb.getNetRules` is read-only. `pcb.getNetLength`, `pcb.getNetInfo`, and `pcb.getNetPrimitives` inspect nets; `pcb.highlightNet` helps locate one. Net class, membership, and differential-pair changes are writes; if an outcome is unknown, stop related writes and read back. Rule results can contain unknowns; do not infer inheritance from empty selectors. Confirm a net's own rule only when source, SDK class, and value agree within supported structures. A returned rule is configuration data, not proof of DRC or manufacturing acceptance.

`pcb.routeDiffPair` routes a differential pair along a center path. Verify two distinct nets and an enabled signal layer. Check copper-edge spacing separately from centerline spacing. Use help for parameters.

`dryRun:true` previews without writing; omitted or `false` executes. Offset direction follows path direction; reversing points swaps the spatial sides but not the net names. The command removes only geometrically equivalent consecutive duplicate points and same-direction collinear intermediate points; it does not snap or lengthen input. It rejects the pair before writing for reversals, self-contact, insufficient positive/negative spacing, or unreliable values. After execution, read each segment back and check source coverage, non-LINE records, and rules. On partial failure, stop dependent writes; no automatic retry, delete, or rollback. `plannedLengths` describe the requested paths, not total net lengths; bends can make the two sides differ. The command does not avoid obstacles, tune lengths, parallel duplicate pads, create differential rules, or save. Success does not prove connectivity, full-board DRC, reference plane, matching lengths, or impedance.

`pcb.tuneLength` tunes an open routing chain within a region. `net`, `targetLength`, and `region:{xMin,yMin,xMax,yMax}` use current PCB coordinates; units are mil. `targetLength` is the selected chain's total centerline length, not all branches of a net. Use `primitiveIds` to select an open chain with matching net, layer, and width and no locked objects. If omitted, `net` and `region` must contain exactly one candidate straight line. Optional `tunePrimitiveId` selects the segment to replace; other selected segments remain. The region bounds new copper and must fully contain both ends of the tuned segment.

Preview with `dryRun:true`; omitted or `false` writes. `side` is `auto`, `left`, or `right`, relative to the path with endpoints sorted; positive normal is `[-dy,dx]`. `auto` tries both sides and available tuning segments. Failure to find a supported meander does not prove no shape can work. For arc style, explicitly supply `bendRadius`, the arc centerline radius. Also supply finite `lengthTolerance` and `minSelfGap` in mil because the SDK does not reliably map local meander radius, tolerance, or self-spacing. Tolerance is total-length error; self-gap is copper edge clearance between non-adjacent new meander segments. Do not substitute differential spacing or another net's tolerance. `parameterSources` identifies caller values versus unconfirmed rule mappings.

If already within tolerance, response is `changed:false` and no write occurs. A target shorter than current length beyond tolerance errors. Non-zero segments must be at least 1 mil. If the old route has a branch, pad, or via mid-segment, confirm it remains connected after replacement or do not write. After success, compare planned and source-readback lengths for the selected chain. On partial/unknown failure, stop; do not retry, rollback, or save automatically. Geometric success does not prove board-wide spacing, connectivity, impedance, or manufacturability.

## Repeated-pad branches

`pcb.routePadBranches` routes branches to repeated pads on two distinct nets. Verify actual pads and trunk endpoints. Check copper-edge clearance and avoid contact between different nets. Use help for parameters.

Resolve starts using real PAD IDs. Without `waypoints`, route directly to the join point; otherwise list intermediate points only. Supported pad shapes are circles, rotated rectangles, plated circular through-holes, and ordinary non-plated outer-layer OVAL capsule pads. OVAL supports horizontal, vertical, and rotated orientations; equal width is treated as a circle, not an ellipse. Prefer valid source dimensions. SDK getters accept exact matches or confirmed nearest 0.1 mil projections and report projection delta. Eccentric/holed OVALs, special layers, and unparseable complex shapes are unsupported. A through-hole route may start within the hole, but its continuous path prefix must then contact the annular ring. Device-pad anchor and geometry conclusions are limited to the SDK model, not embedded footprint-source precision.

Branches on one side may meet at the join or share a continuous suffix after joining. Grazing apart and rejoining, or leaving then returning to a pad, is rejected before writing. `trunk` can target an actual LINE endpoint or a verified ARC endpoint. The plugin checks net, layer, and endpoint; ARC contact is confirmed only when current SDK readback and valid source for the same ID agree. Missing ARC source, failed readback, or mismatch stays unknown and is reported in `arcContactResolution`. The caller does not need a separate curve check to assemble proof fields. Omitting `trunk` means only the branches join; it does not prove connection to an existing trunk. Optional `dryRun:true` previews without a plan token. Writes and readbacks are serial. On failure, completed segments and failure stage are retained; no auto retry, rollback, or save. The host may merge/split LINEs and change IDs; check final geometry coverage instead of redrawing because an old ID disappeared. Results do not establish full-board DRC, native connectivity, or impedance.

`pcb.connectComponentPadDirect` is a retained but disabled compatibility entry. On EDA 4.1.78, it rejects before accessing the project or SDK with `disabled:true`, `retryable:false`, and `writeAttempted:false`. Read-only per-pad inspection remains available through `pcb.getComponentPads`; configuration readback does not prove the host used that connection rule.

Official references: [90-degree arc equal-length style](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/index.html), [ARC API](https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_primitivearc.create.html), and [PCB ARC format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/arc.md). Documentation does not replace testing in the active host.


## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Holes, pads, vias | `pcb.placeHole`, `pcb.placePad`, `pcb.placeVia` | Create mechanical holes, standalone SMD pads, or vias. Choose hole type, plating, and dimensions from the design and manufacturing requirements. |
| Routing | `pcb.routeTrack` | Route a net along a path. The plugin currently rejects segments shorter than 1 mil (25.4 μm) before writing; this is a plugin rule, not an SDK limit. |
| Fanout and local routing | `pcb.getFanoutPlan`, `pcb.fanout`, `pcb.getPadExpansionPlan`, `pcb.expandPads`, `pcb.routePadBranches`, `pcb.routeDiffPair` | Plan or execute fanout, pad expansion, branches, and differential routes. Inspect plan and target nets first. |
| Special checks and tuning | `pcb.tuneLength`, `pcb.inspectCurveReadback` | Inspect or adjust curve and trace length. Check current help for supported parameters and host support. |
| Tracks, vias, and nets | `pcb.listLines`, `pcb.modifyLine`, `pcb.listVias`, `pcb.modifyVia`, `pcb.getNetRules`, `pcb.getNetLength`, `pcb.getNetPrimitives`, `pcb.highlightNet`, `pcb.setNetLock` | Use actual objects and nets, then read back. |
