# PCB 6 · Verify and Save

Use `__help` in the target window for parameters, defaults, results, and examples.

<a id="pcb-stage-check"></a>
## PCB Stage Check

At each applicable checkpoint, read the current board, run `node <skill>/scripts/check-pcb-stage.mjs <check.json>`, and retain its JSON output. File paths are relative to the configuration file. Look up command parameters with `__help` in the target window.

| `stage` | When to run and what to provide |
| --- | --- |
| `placement` | After placing or moving parts in each functional area and before routing that area. Set `placementFile` to the placement checker input with the current board digest. Check body, board, and slot clearances, nearby parts, and assembly space. For fine-pitch parts, set `manufacturing.exportTemporary: true` or supply matching Gerber to check mask webs and merged openings. |
| `routing` | After each routing, trace edit, or drilling batch and after finishing each functional area. Set `routing` to a region or nets accepted by `pcb.reviewLocalRouting`. Check trace width, copper clearance, drill size, annular rings, drill spacing, copper to board and cutout edges, and connections at the area boundary. When changes affect nearby vias, exposed pads, or fine-pitch pads, recheck mask and paste openings using current Gerber and drill files. Compare board-wide connectivity and DRC against the pre-edit results. |
| `repour` | After each actual refill. Optionally set `copper` to `[{primitiveId,sections:[{id,start,end,minimumMm}]}]`. Section endpoints use mil and the width limit uses mm. Check key power and ground ties and added disconnections. |
| `manufacturing` | After generating the final Gerber, drill, BOM, and placement files and before release. Set `manufacturing.gerber`, `revision`, and `object`. If available, supply `stencil` and `assembly` with `bom`, `placement`, `assignment`, and actual part dimensions. |

Common configuration fields are `proxyUrl`, `instanceId`, `projectUuid`, `docUuid`, and `stage`. Record the process authority in `process.source`. Supply order material, thickness, and copper weights as `process.pcbDfm` using the current `pcb.runDfm` help. Set `process.minimumViaHoleGapMm` and `process.minimumMaskBridgeMm` to the confirmed hole-edge gap and mask-opening web for this order. To retain a temporary export, set `manufacturing.saveTemporaryAs` to a new file path.

Identify each functional area by name, board region, and relevant references or nets. Include its boundary and nearby objects that can affect it. For checks that run on the whole board, locate the relevant findings in the area and record the coverage. Several areas can share one board readback. Keep separate placement and routing results for each area with their PCB revisions.

Resolve findings that affect routing or delivery and rerun the affected checks. Review `incomplete` items and rerun stale reports. Supply separate evidence for omitted checks such as assembly interference, merged openings, special holes, hole-to-copper spacing across layers, minimum copper neck across the full region, islands, and actual connectivity. Check current, temperature rise, impedance, and return paths against the project requirements.

## Before-and-After Comparison

1. Before each batch affecting nets, traces, vias or copper, retain board-wide ratlines, connection and DRC details, and relevant objects and rules. Complete paginated reads and record revision and coverage.
2. Reread under the same rules and scope. Compare target connectivity, added or changed findings across all nets, power and reference copper, non-target parts and routing, and rules. Match by net, layer, location and geometry. A lower DRC count can still contain a new disconnection.
3. Check obstacles on every actual via layer. Check drill-to-pad spacing, including same-net objects where applicable. Where 45° routing is required, also check reversals and acute joints. Local checks establish only their stated coverage.
4. Use [Write Reconciliation](write-reconciliation-and-recovery.md) to separate IDs from actual copper. Follow [Power and Ground Tie-In](pcb-power-ground-connectivity.md) for affected power, ground and reference copper. Apply the save/reopen scope below.
5. Generate reports from matching readback. Separate component displacement, trace-length change, net via change, planned paths, actual segments and ID changes. Record inspected layers, save/reopen state and outstanding checks. Keep current results separate from historical batches.

<a id="pcb-completion-checks"></a>
## Completion Checks

First state PCB, sheet/board number, objects in scope, and acceptance stage. A local task checks only its target and affected interfaces. Use confirmed schematic connectivity, mechanical conditions, critical-net requirements, and manufacturing process.

Use `pcb.zoomToBoardOutline` to fit the board outline with the native PCB view command. It does not move primitives or fall back to zooming all. A successful response confirms SDK success and a consistent target before and after the command; `visualVerified:false` means the visible view still needs visual inspection.

### Acceptance Items, Methods, and Pass Conditions

| Item | How to check | Pass condition |
| --- | --- | --- |
| Design correspondence and nets | Read back with `listComponents`, `getComponentPads`, `listNets`, and applicable netlist/net primitives; compare components, footprints, pin order, and all required pads. Check every repeated channel. | No missing parts, wrong footprints/polarity, or unintended net changes. Unnetted pads are classified by purpose; do not force-ground them to clear warnings. |
| Outline, holes/slots, and mechanics | Compare mechanical drawings with outline, holes/slots, component locations/body outlines; inspect top/bottom and applicable 3D/assembly data for height, insertion, mounting, and probe access. | Dimensions, location, and orientation meet confirmed conditions with no body or assembly interference. Pad non-overlap alone is insufficient; report missing required evidence. |
| Stackup and rules | Read available layers, rules, and physical stackup; compare signal/reference layers, copper/dielectric thickness, and net/layer/region rules. Where unsupported, inspect applicable sources or EDA UI. | Design conditions and affected objects are clear. Layer count/name does not prove physical stackup; unknown values are not replaced with defaults. |
| Placement and routability | Use actual pads, `checkPlacement`, and current local geometry for functional groups, critical support parts, and exits. Check constrained corridors for the whole trace group, widths, clearances, vias, and all-layer obstacles. | Required local circuits and return paths are reasonably placed with feasible space for affected trace groups. Recheck collision candidates; skipped objects or pad-box approximations are not a complete pass. |
| Traces, vias, and connectivity | Use `pcb.reviewLocalRouting` with `listLines`, `listVias`, `getNetInfo`, `getNetPrimitives`, and applicable DRC to check local trace/arc contacts and known same-layer clearances to supported pad shapes and vias. Inspect its coverage and read status. For fanout, `coverage.geometryReview.readCounts` are SDK getter read counts; assess `coverage.geometryReview.warnings`, `coverage.geometryReview.unknown`, and `coverage.geometryReview.status` for local completeness. | The report covers only readable supported shapes. Distances to objects with unassigned nets are reported separately and are not treated as confirmed inter-net clearance violations. Unknown pad shapes, via spans, cross-layer contacts, and copper pours remain unverified. Full electrical connectivity and copper-island proof are not implemented; this is a tool scope limit, not an EDA defect. It does not replace DRC. |
| Critical electrical paths | Check power paths, sensing, reference plane, returns, layer changes, differential pairs, and length against project/manufacturer requirements; use actual geometry and selected parameters. | Required ampacity/drop/temperature, impedance/timing, and return conditions meet their stated basis. Mark not-applicable items; supplement tool gaps; missing data cannot pass. |
| Copper and silkscreen | Use `pcb.reviewCopperShape` for a selected pour's supported outline, open copper strokes, and requested cross-sections. Use `listPours`, `getPourFillReadback`, `checkSilkscreen`, and current top/bottom views for fill, connection, text, polarity, edge, and pin order. | Reported widths apply only to the requested sections and stated coverage, not the narrowest point over the whole pour. Sharp-corner candidates cover only straight-connected corners on the outer contour. This check does not prove electrical connectivity or islands; those checks are not implemented, rather than known EDA defects. Boundary-only, `no-fill`, source candidates, or `complete:false` do not prove completion. |
| DRC and manufacturing | Run `runDrcDetailed` with complete coverage on the final whole-board revision. For manufacturing delivery, use applicable `runDfm`, `runSmtDfm`, and `checkManufacturingProfile`; check manufacturing files and order conditions. | No unresolved errors; remaining warnings are handled per confirmed project decisions. Unsupported, skipped, approximate, and unknown items are checked separately or listed incomplete; do not mask issues by changing rules/default process. |
| Board view and persistence | Inspect updated top/bottom, critical regions, and applicable layers; verify object and current PCB state. Apply the save/reopen scope below and compare target and non-target content. | View and persisted state match checked scope. Old screenshots, local DRC, or command success alone do not prove whole-board acceptance. |

Report placement, routing, electrical, mechanical, and manufacturing separately. For local work, mark unperformed whole-board/production checks out of scope, not passed. If required evidence for manufacturing is missing, list it incomplete. Realtime/custom DRC is not a complete check; clearing a marker is not a repair.

### Screenshot-Assisted Inspection

After placement, local routing or copper work, inspect the affected scope in this order: find visual candidates, measure with commands, then confirm with applicable DRC and saved-data readback. Screenshots do not replace precise geometry or electrical checks.

1. Read the current project and PCB identity, then match the visible project/page and recognizable components or outline. Do not draw conclusions from a stale image, an unknown source or a mismatched window title and canvas. Capture again or ask for the corresponding user image; independent data checks can continue.
2. Inspect a board or scoped overview, then enlarge critical joints, layer changes, necks and suspected defects. Show top, bottom and relevant inner layers separately as needed. Confirm copper is displayed as actual fill rather than its boundary; read-only inspection does not authorize repouring or changing rules.
3. Record a locatable position, reference or net, layer and image source. When follow-up comparison is needed, keep images in the project's existing evidence location and associate them with the board revision. Avoid unlocatable crops.
4. Verify candidates as below. Mark missing evidence unresolved; visual contact, no visible airwires or matching colors are not proof of connectivity.

| Visual candidate | Follow-up verification |
| --- | --- |
| Broken/missing trace or trace-to-pad contact | Read pad nets and trace endpoints; combine `pcb.reviewLocalRouting`, net readback and applicable DRC. Visible contact does not prove same-net or cross-layer connectivity. |
| Suspected unused routing | Use `pcb.reviewRoutingRemnants` to scan the board or named nets for unused branches, same-net overlaps and vias with limited observed contact. Check the recorded layers, actual copper, pad coverage and protection hints. Review potential stitching, thermal and current-sharing duties before approving any removal. After an approved cleanup, recheck affected connectivity and clearance, run applicable DRC and compare the saved, reopened board. |
| Routing detours | Use `pcb.reviewRoutingDetours` to check actual path length, turns, vias and backtracking. Review same-layer shortcuts against the reported obstacles and rules. A geometry preview still needs verification. The check leaves routing untouched. |
| Separate copper fragment or suspected island | Check actual fill, net, vias and connections on relevant layers. A small fragment may connect through another layer; missing connection evidence cannot establish an island. |
| Narrow copper neck | Use `pcb.reviewCopperShape` with a section approximately perpendicular to the local copper path and extending beyond both edges. Read width and coverage using current help. Do not infer precise dimensions from pixels or a whole-zone minimum from one section. |
| Special pad or blind/buried-via contact | Compare pad shape, drill size, layer span and connections on each layer. A single-layer image cannot establish via span; list unsupported geometry explicitly. |
| Direct or thermal copper connection | Inspect both enlarged actual fill and the relevant zone properties, then read back affected objects and connection settings. Apply the current save-verification scope; a properties screenshot alone does not prove settings were applied. |

After a correction, recapture the affected region and recheck its relevant data. Separate visual observations, data-confirmed findings and unresolved items. Visual candidates are not automatically confirmed violations, and images cannot clear tool unknowns. Full electrical connectivity, island detection and whole-zone minimum-neck checks remain subject to actual capabilities, not enabled merely by this inspection procedure.

### Interpret DRC results

`pcb.runDrc.violations` retains the native result tree. `pcb.runDrcDetailed.violations` lists individual violations, while `rawResult` retains the complete native tree. Counts classify leaf items by severity; unknown items or incomplete returned branches must not be treated as a pass. `passed` only means this API call listed no violations; it does not prove that every rule or manufacturing requirement passed. Check `__help` for fields and parameters.

For recognized native detailed-result leaves, `xMil` and `yMil` are in mil relative to the data origin (`coordinateUnit:"mil"`, `coordinateBasis:"data-origin"`). Do not add a canvas-origin offset when using these coordinates. Raw `x`, `y`, and the full raw tree remain available. Leaves whose native structure is not recognized have no mil coordinates and cannot be located by coordinates. This mapping reflects observed native structures, not a universal unit guarantee from the official API.

Coordinate-based view zoom remains limited: public zoom APIs can report success without changing the visible view. Verify the actual canvas before reporting successful localization. Use `pcb.select` with violation object IDs to help find objects; selection does not replace coordinate zoom or move primitives.

### Save and Reopen Scope

- New whole-board work or formal whole-board delivery: after writes and save confirmation, close and reopen the affected PCB. Verify identity, component attributes, pad nets, traces/vias, rules, actual pours, and current view against the pre-close state.
- Ordinary local changes (position, angle, silkscreen, attributes, added traces, or routine repour): compare the target, affected connections, and non-target content, then save. Do not require reopening the entire project each time.
- If this delivery deletes/replaces components or existing routes, changes nets or stackup, copies a PCB, or explicitly requires persistence verification: save, reopen the affected PCB, and check the relevant content; do not compare only primitive IDs/counts.
- If not reopened, report “saved; reopen not verified.” Report “save and reopen verified” only after readback. If write/save status is unknown, first investigate the original operation; do not force-close, replay, or mask uncertainty with another save.

### Restore one PCB from a source backup

Before a multi-object edit that would be costly to reconstruct, `pcb.sourceCheckpoint` can make a verified source checkpoint. It does not edit or save the PCB. Confirm `verified:true` and read the returned storage location; the proxy file stack keeps the latest five checkpoints per project, while the offline extension-storage fallback is a single slot and can replace the previous checkpoint.

Use `pcb.sourceRollback` only for an explicitly authorized restore of one PCB. `verifyPersistence` defaults to `true`; check `__help` for parameters. Do not rely on this path to restore complex filled copper: filled objects may be missing and rebuilding them may change copper geometry. This recovery has not passed for complex poured boards.

1. Compare the complete restored source with the selected backup.
2. Confirm the result reports `saved:true`.
3. Confirm the target PCB page closes, reopen that PCB, and compare the complete source again.

If `saved:false` or the PCB was not reopened and rechecked, do not report a persistent restore. If any result is unknown, stop dependent work and inspect the current PCB. Full-project `module.restoreFile` is a separate merged-import path that remains metadata-only with `contentVerified:false`; it does not prove complete source restoration.

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

- Use `pcb.getRevision` to compare a prior DRC report with the current board and rule snapshots. Rerun DRC if the result is stale or its revision cannot be confirmed.
- Back up and read back the intended modification before using `pcb.save` with reopen verification. Check both the save acknowledgement and the comparison after reopening.
- Use `pcb.reviewLocalRouting` for local trace/arc contact candidates and known same-layer clearance estimates against supported pad shapes and vias. Distances to objects with unassigned nets are listed separately, not as confirmed inter-net violations. Check coverage and read status; full electrical connectivity and copper-island proof are not implemented.
- Use `pcb.reviewCopperShape` for one selected pour and optional requested cross-sections. Sections do not identify the narrowest point across the whole pour; sharp-corner candidates cover only straight-connected corners on the outer contour. Do not infer whole-pour minimum neck, electrical connectivity, or islands.
- For DFM, inspect manufacturing silkscreen findings and any supplied pad-purpose evidence separately from pad clearance.

1. Use `pcb.runDrcDetailed` to locate issues by object, net, rule, and layer; do not rely on totals alone.
2. Use `pcb.runDfm`, `pcb.runSmtDfm`, and `pcb.checkManufacturingProfile` as required. Profile data needs sources; verify actual manufacturer stackup, calculations, and order separately.
3. After `pcb.save`, check the result. Follow the [save and reopen scope](pcb-06-verify-and-save.md#save-and-reopen-scope): local changes generally need target/affected/non-target readback and save; whole-board delivery or listed persistence-sensitive changes require reopening the affected PCB.
4. Export Gerber, BOM, placement data, or netlist as needed. Check units, layers, holes, and component information using [production file requirements](manufacturing-file-requirements.md).

DRC, manufacturing geometry checks, and production-order consistency are separate conclusions. If project manufacturing data is missing, do not guess board thickness, copper weight, Dk, or impedance parameters.

## Order checks and manufacturing profile

`pcb.runDfm` checks PCB process rules; `pcb.runSmtDfm` checks SMT assembly; `pcb.checkSameNetPadSpacing` checks same-net pad spacing. All three are available under AI Command Engine on the PCB page and use the same processing and summary as the commands. These checks do not edit the board, save, upload, or place an order.

Use the confirmed machine-placement designators for SMT DFM. For final single-board or panel files, use `dfm.inspectManufacturingFiles` with the matching Gerber, drill files, placement BOM and coordinates. Inspect mask openings, body and edge clearance, drill-to-paste overlap, and mouse-bite candidates. Check missing inputs in the report. Identify whether the paste file is design artwork or the actual stencil.

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
| Board view, DRC, and save | `pcb.zoomToBoardOutline`, `pcb.runDrc`, `pcb.runDrcDetailed`, `pcb.getNetInfo`, `pcb.save` | Fit the outline without moving primitives, run DRC, inspect a net, and save. `visualVerified:false` needs visual inspection; a clean DRC alone does not prove full rule or manufacturing acceptance. |
| PCB source checkpoint | `pcb.sourceCheckpoint` | Before a multi-object change, create and verify a checkpoint. It does not edit or save the PCB; check the returned storage location and retention behavior. |
| PCB source recovery | `pcb.sourceRollback` | Restore one explicitly authorized PCB from a source backup; default `verifyPersistence:true`, compare complete source, confirm save and close, then reopen and compare again. |
| Manufacturing checks | `pcb.runDfm`, `pcb.runSmtDfm`, `pcb.checkSameNetPadSpacing` | Check PCB process, SMT placement, or same-net pad spacing. Review each command's coverage and unknowns. |
| Manufacturing output | `pcb.exportGerber`, `pcb.exportPickPlace` | Export Gerber or placement data. Check each output for the current project. |
| Manufacturing profile, export, and deletion | `pcb.checkManufacturingProfile`, `pcb.exportNetlist`, `pcb.delete` | Verify inputs and targets, then check the delivery scope. |
