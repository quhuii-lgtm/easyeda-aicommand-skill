# PCB 6 · Verify and Save

Use `__help` in the target window for parameters, defaults, results, and examples.

## Before-and-After Comparison

Follow the [PCB command workflow](pcb-06-verify-and-save.md) for modification, deletion, and saved readback. Compare nets and geometry, and retain unexplained differences for review.

- After same-net traces merge, check endpoints, route, layer, and width.
- When a generated copper ID changes, separately check the boundary, filled geometry, and connectivity.
- Report ID-only changes separately from actual copper changes.

<a id="pcb-completion-checks"></a>
## Completion Checks

First state PCB, sheet/board number, objects in scope, and acceptance stage. A local task checks only its target and affected interfaces. Use confirmed schematic connectivity, mechanical conditions, critical-net requirements, and manufacturing process.

### Acceptance Items, Methods, and Pass Conditions

| Item | How to check | Pass condition |
| --- | --- | --- |
| Design correspondence and nets | Read back with `listComponents`, `getComponentPads`, `listNets`, and applicable netlist/net primitives; compare components, footprints, pin order, and all required pads. Check every repeated channel. | No missing parts, wrong footprints/polarity, or unintended net changes. Unnetted pads are classified by purpose; do not force-ground them to clear warnings. |
| Outline, holes/slots, and mechanics | Compare mechanical drawings with outline, holes/slots, component locations/body outlines; inspect top/bottom and applicable 3D/assembly data for height, insertion, mounting, and probe access. | Dimensions, location, and orientation meet confirmed conditions with no body or assembly interference. Pad non-overlap alone is insufficient; report missing required evidence. |
| Stackup and rules | Read available layers, rules, and physical stackup; compare signal/reference layers, copper/dielectric thickness, and net/layer/region rules. Where unsupported, inspect applicable sources or EDA UI. | Design conditions and affected objects are clear. Layer count/name does not prove physical stackup; unknown values are not replaced with defaults. |
| Placement and routability | Use actual pads, `checkPlacement`, and current local geometry for functional groups, critical support parts, and exits. Check constrained corridors for the whole trace group, widths, clearances, vias, and all-layer obstacles. | Required local circuits and return paths are reasonably placed with feasible space for affected trace groups. Recheck collision candidates; skipped objects or pad-box approximations are not a complete pass. |
| Traces, vias, and connectivity | Use `listLines`, `listVias`, `getNetInfo`, `getNetPrimitives`, and applicable DRC to check actual endpoints, net, layer, width, copper/drill, and pad contact; zoom into critical joints. | In-scope connections match intent; whole-board routing has no unresolved required disconnections. Flyline refresh, nonempty IDs, segment counts, or completed autorouter service do not prove connectivity. |
| Critical electrical paths | Check power paths, sensing, reference plane, returns, layer changes, differential pairs, and length against project/manufacturer requirements; use actual geometry and selected parameters. | Required ampacity/drop/temperature, impedance/timing, and return conditions meet their stated basis. Mark not-applicable items; supplement tool gaps; missing data cannot pass. |
| Copper and silkscreen | Use `listPours`, `getPourFillReadback`, `checkSilkscreen`, and current top/bottom views to inspect actual copper, openings, designators, polarity, edge, and pin order. | Required copper is filled with correct connectivity/continuity and silkscreen is readable. Boundary-only, `no-fill`, source candidates, or `complete:false` do not prove completion. |
| DRC and manufacturing | Run `runDrcDetailed` with complete coverage on the final whole-board revision. For manufacturing delivery, use applicable `runDfm`, `runSmtDfm`, and `checkManufacturingProfile`; check manufacturing files and order conditions. | No unresolved errors; remaining warnings are handled per confirmed project decisions. Unsupported, skipped, approximate, and unknown items are checked separately or listed incomplete; do not mask issues by changing rules/default process. |
| Board view and persistence | Inspect updated top/bottom, critical regions, and applicable layers; verify object and current PCB state. Apply the save/reopen scope below and compare target and non-target content. | View and persisted state match checked scope. Old screenshots, local DRC, or command success alone do not prove whole-board acceptance. |

Report placement, routing, electrical, mechanical, and manufacturing separately. For local work, mark unperformed whole-board/production checks out of scope, not passed. If required evidence for manufacturing is missing, list it incomplete. Realtime/custom DRC is not a complete check; clearing a marker is not a repair.

### Save and Reopen Scope

- New whole-board work or formal whole-board delivery: after writes and save confirmation, close and reopen the affected PCB. Verify identity, component attributes, pad nets, traces/vias, rules, actual pours, and current view against the pre-close state.
- Ordinary local changes (position, angle, silkscreen, attributes, added traces, or routine repour): compare the target, affected connections, and non-target content, then save. Do not require reopening the entire project each time.
- If this delivery deletes/replaces components or existing routes, changes nets or stackup, copies a PCB, or explicitly requires persistence verification: save, reopen the affected PCB, and check the relevant content; do not compare only primitive IDs/counts.
- If not reopened, report “saved; reopen not verified.” Report “save and reopen verified” only after readback. If write/save status is unknown, first investigate the original operation; do not force-close, replay, or mask uncertainty with another save.

### Acceptance Result Format

State the PCB, board number/revision, scope, and stage (placement/routing/manufacturing). Report each applicable item as a row; specify functional group/scope and avoid pasting raw responses.

| Item and scope | Result | Check basis | Unresolved or incomplete items |
| --- | --- | --- | --- |
| Functional group/net/object and acceptance item | Pass / Fail / Incomplete / N/A | Current-object readback, path/rule comparison, inspected image, or DFM result. | Specific issue, missing check, and reason; write “None” when empty and explain N/A. |

State actual save/reopen status. Any applicable failure makes the overall result fail; a required incomplete item prevents an overall pass. Local pass does not imply whole-board, production, or physical-performance acceptance. After changing parameters or rules, recheck affected items and dependent checks only.

## Run DFM After DRC

After complete DRC passes, run PCB DFM and applicable SMT manufacturing/assembly checks for the intended order process. Use the DFM command reference linked from the skill entry and check the installed version, parameters, and coverage limits.

- Verify target PCB, saved revision, material, board thickness, copper thickness, stackup, and assembly process.
- Compare the drawing, check inputs, and intended order process; record differences and their resolution.
- Check report completeness, item-level results, and coverage; API success alone is insufficient.
- Use an applicable method to check required items that were skipped, unsupported, or approximated, and keep the basis.
- Do not replace an unsupported process with a supported default just to obtain a pass.
- After fixes, rerun checks. Keep complete DRC and applicable DFM results for the final submission revision.
- If manufacturer parsing is required, export check files and upload under existing authorization. Do not submit the order until parsing passes.

Report the result revision, input process, item-level outcomes, supplemental-check basis, and unresolved issues for project-stage acceptance. Passing within the tool's coverage does not mean all manufacturing requirements pass.

## Checks, save, and manufacturing exports

1. Use `pcb.runDrcDetailed` to locate issues by object, net, rule, and layer; do not rely on totals alone.
2. Use `pcb.runDfm`, `pcb.runSmtDfm`, and `pcb.checkManufacturingProfile` as required. Profile data needs sources; verify actual manufacturer stackup, calculations, and order separately.
3. After `pcb.save`, check the result. Follow the [save and reopen scope](pcb-06-verify-and-save.md#save-and-reopen-scope): local changes generally need target/affected/non-target readback and save; whole-board delivery or listed persistence-sensitive changes require reopening the affected PCB.
4. Export Gerber, BOM, placement data, or netlist as needed. Check units, layers, holes, and component information using [production file requirements](manufacturing-file-requirements.md).

DRC, manufacturing geometry checks, and production-order consistency are separate conclusions. If project manufacturing data is missing, do not guess board thickness, copper weight, Dk, or impedance parameters.

## Order checks and manufacturing profile

`pcb.runDfm` checks PCB process rules; `pcb.runSmtDfm` checks SMT assembly; `pcb.checkSameNetPadSpacing` checks same-net pad spacing. All three are available under AI Command Engine on the PCB page and use the same processing and summary as the commands. These checks do not edit the board, save, upload, or place an order.

Ask the user for the copper weight for this order. Verify that the target help supports the required inputs. Copper weight applies to PCB DFM only.

Current coverage is 18 PCB DFM items, 7 SMT DFM items, and 1 same-net spacing item. The response `data` includes `results`, `expectedCount`, `issues`, `coverage`, `documentUuid`, `checkType`, `inputs`, `timestamp`, `upstream`, and summary state. Report a pass within the command's scope only when `complete:true` and `passed:true`. `ok:true` means the handler returned successfully; compatibility field `upstreamPassed` does not mean JLC's online service passed.

Missing input, failed reads, or fallback/inferred required data must leave the check incomplete. Review `coverage`, `issues`, and `upstream`, not only `passed` or issue count. Source copper-thickness reports are separate from DFM judgment. A mismatch in the drawing, or missing/unparseable physical-layer data, does not by itself fail DFM or establish copper-weight matching.

These checks use local process tables and geometry algorithms; they are not a live, exhaustive JLC website check or production release. Geometry limitations include: spacing only counts positive gaps between `Line` objects, not touching, overlap, `Arc`, or `Polyline`; oblong pads and uneven annular rings use maximum-axis approximations; same-net pad spacing uses capsule and inscribed-circle approximations. Copper-layer count uses a copper-primitive heuristic; component class may be identified by name; list index may help locate IDs. Reported positions are for review only; the command does not repair the board. The menu can show item results and issue positions and lets the user export TXT or JSON. AI commands do not open a save dialog, clear logs, or automatically write a report. Confirm the active PCB matches the report before using coordinates.

`pcb.checkManufacturingProfile` is a read-only comparison of caller-supplied JSON `profile` and readable PCB rules. It does not save settings, modify the board, or order boards. Pass profile content as a file; do not place it in project description or claim extension settings persist with the project.

Collect the manufacturer stackup, order selections, and actual order confirmation. For impedance, include the actual calculation record and map nets to EDA copper layers. Use target-window help for the profile schema. Keep missing evidence unknown and distinguish nominal from finished thickness.

Review matched, mismatched, unknown, and inapplicable items separately. Report matches within the available evidence. Physical-layer readback alone cannot confirm the production stackup or order.

References: [JLC impedance and stackup](https://jlcpcb.com/impedance), [JLC impedance calculator](https://jlcpcb.com/pcb-impedance-calculator), and [official rule selector format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/rule_selector.md). Definitions do not prove host behavior or production acceptance.

## Net queries and manufacturing exports

| Command | Output | Limits |
| --- | --- | --- |
| `pcb.exportDsn` | Autorouter DSN; supported versions also return matching `routeBaseline`. | Keep the response and DSN sent to the service; rules may still be incomplete. |
| `pcb.exportNetlist` | Current PCB netlist. | Success does not establish connectivity; verify board and net source. |
| `pcb.exportGerber` | Manufacturing Gerber data. | Check layers, holes, outline, and file integrity; export is not production acceptance. |
| `pcb.exportPickPlace` | Placement data. | Check components, units, origin, and orientation; export is not placement-data acceptance. |
| `pcb.autoRouteGetResult` | Original SES filename and Base64. | Read-only; not imported or saved. |

Decode or save manufacturing exports according to returned format; check encoding, content, and file fields from current help. Check completeness and consistency with project and manufacturing settings. File presence, decodable Base64, or router success does not replace content review, PCB DRC, manufacturing review, or order confirmation.

`pcb.select`, `pcb.clearSelection`, and `pcb.getSelection` manage current selection; `pcb.crossProbe` locates designators, pins, or nets between schematic and PCB; `pcb.getComponentPads` reads component pads. Verify instance and object IDs first. Cross-probe, highlight, and selection aid inspection but do not prove connection or save state. Net topology can combine `pcb.getNetInfo`, `pcb.getNetPrimitives`, `pcb.getNetLength`, and `pcb.exportNetlist`; consistent readings still do not replace relevant DRC and connectivity checks.

On EDA 4.1.78, these commands have explicit EDA 4.2 version guards: `pcb.getCurrentLayer`, `pcb.listStackingConfigs`, `pcb.getStackingConfig`, `pcb.applyStackingConfig`, `pcb.saveStackingConfig`, `pcb.renameStackingConfig`, `pcb.deleteStackingConfig`, `pcb.setDefaultStackingConfig`, `pcb.startRealTimeDrc`, `pcb.stopRealTimeDrc`, and `pcb.getRealTimeDrcStatus`. Execution, saving, and readback still need confirmation on a supported version.


For production delivery, continue with [Manufacturing File Requirements](manufacturing-file-requirements.md) for output and order checks.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Checks and save | `pcb.runDrc`, `pcb.runDrcDetailed`, `pcb.getNetInfo`, `pcb.save` | Run DRC, inspect a net, and save. A clean DRC alone does not prove manufacturability. |
| Manufacturing checks | `pcb.runDfm`, `pcb.runSmtDfm`, `pcb.checkSameNetPadSpacing` | Check PCB process, SMT placement, or same-net pad spacing. Review each command's coverage and unknowns. |
| Manufacturing output | `pcb.exportGerber`, `pcb.exportPickPlace` | Export Gerber or placement data. Check each output for the current project. |
| Manufacturing profile, export, and deletion | `pcb.checkManufacturingProfile`, `pcb.exportNetlist`, `pcb.delete` | Verify inputs and targets, then check the delivery scope. |
