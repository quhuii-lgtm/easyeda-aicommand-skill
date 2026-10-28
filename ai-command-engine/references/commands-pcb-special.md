# PCB Special Topics

This guide covers multi-step PCB geometry, manufacturing checks, differential routing, silkscreen inspection, autoroute import, and production exports. Send `/command` with `cmd`, top-level `instanceId`, and `params`; the instance must target the PCB. Check parameters and response fields in that instance's `/help?cmd=<command>`. Each macro step must use the right instance.

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

## Order checks and manufacturing profile

`pcb.runDfm` checks PCB process rules; `pcb.runSmtDfm` checks SMT assembly; `pcb.checkSameNetPadSpacing` checks same-net pad spacing. The EDA menu and commands use the same processing and summary. These checks do not edit the board, save, upload, or place an order.

Confirm current help for parameters. `material` supports values such as `FR4`, `HDI板`, `高频板`, `铝基板`, or `铜基板`; help is authoritative. `thickness` is a finite positive value in mm. `outerCopperOz` currently accepts numeric 1 or 2; `innerCopperOz` accepts numeric 1. `standard` is `economy` or `standard`. `minSpacingMm` is a finite positive same-net pad spacing threshold. The user must specify copper weight for the current order; do not infer it from the drawing or defaults. Copper-weight fields apply only to PCB DFM, not SMT DFM or same-net spacing. Verify the installed help exposes the needed fields; sending an extra parameter does not prove an older version checked it.

Current coverage is 18 PCB DFM items, 7 SMT DFM items, and 1 same-net spacing item. The response `data` includes `results`, `expectedCount`, `issues`, `coverage`, `documentUuid`, `checkType`, `inputs`, `timestamp`, `upstream`, and summary state. Report a pass within the command's scope only when `complete:true` and `passed:true`. `ok:true` means the handler returned successfully; compatibility field `upstreamPassed` does not mean JLC's online service passed.

Missing input, failed reads, or fallback/inferred required data must leave the check incomplete. Review `coverage`, `issues`, and `upstream`, not only `passed` or issue count. Source copper-thickness reports are separate from DFM judgment. A mismatch in the drawing, or missing/unparseable physical-layer data, does not by itself fail DFM or establish copper-weight matching.

These checks use local process tables and geometry algorithms; they are not a live, exhaustive JLC website check or production release. Geometry limitations include: spacing only counts positive gaps between `Line` objects, not touching, overlap, `Arc`, or `Polyline`; oblong pads and uneven annular rings use maximum-axis approximations; same-net pad spacing uses capsule and inscribed-circle approximations. Copper-layer count uses a copper-primitive heuristic; component class may be identified by name; list index may help locate IDs. Reported positions are for review only; the command does not repair the board. The menu can show item results and issue positions and lets the user export TXT or JSON. AI commands do not open a save dialog, clear logs, or automatically write a report. Confirm the active PCB matches the report before using coordinates.

`pcb.checkManufacturingProfile` is a read-only comparison of caller-supplied JSON `profile` and readable PCB rules. It does not save settings, modify the board, or order boards. Pass profile content as a file; do not place it in project description or claim extension settings persist with the project.

Key profile fields:

| Field | Requirement |
| --- | --- |
| `schemaVersion`, `profileId`, `revision` | Version `1`, with profile file and revision identifiers. |
| `manufacturer`, `productType`, `stackupId` | State manufacturer, product, and specific stackup. |
| `source` | `{url,observedAt}` for actual source and lookup time. |
| `selection` | `{copperLayers,nominalThicknessMm,outerCopperOz,innerCopperOz}`. |
| `officialStackup` | Matching `stackupId` and `orderedLayers:[{name,kind,thicknessMm,material?,dk?}]`; `kind` is `copper`, `prepreg`, or `core`. Use string `unknown` for unknown values. |
| Finished thickness | Optional `finishedThicknessMm` and `finishedTolerancePercent`, only when specified by the stackup. |
| `calculations` | Optional array of impedance calculation records. |
| `orderConfirmation` | Real order confirmation with `schemaVersion:1`, `confirmed:true`, source, manufacturer, product, stackup, and confirmed `selection`. |
| `impedanceService` | Omitted means unknown; `null` means explicitly unavailable. If available, include source and calculation records. |

For more than two copper layers, `selection.innerCopperOz` must be finite and positive; omit it for one- or two-layer boards. Apply the same rule to order selection. Do not substitute planned values for missing real order confirmation or hide missing order data because inner copper is inapplicable.

Each calculation record includes `id`, `stackupId`, `source`, `evidenceStatus`, `model`, `targetOhm`, `signalLayer`, reference layer(s), width, applicable spacing or copper gap, compensation switch, and `bindings`. `evidenceStatus` is `verified` or `unverified`; verified means caller supplied visible calculation evidence, not plugin certification. Order stackup layers top-to-bottom with unique names. Signal and reference layers must identify copper layers. Use `null` for a confirmed absent reference layer; omit an unconfirmed value. Do not use `null` for unknown.

Models are `single-ended-non-coplanar`, `single-ended-coplanar`, `differential-non-coplanar`, or `differential-coplanar`. Only differential models use `spacingMil`; only coplanar models use `copperGapMil`. Omit inapplicable fields instead of setting them to zero. `widthSpacingComplement` records the calculator's actual compensation switch, not impedance tolerance.

`bindings:[{net,edaLayerId,layerMappingSource}]` identifies net, EDA layer ID, and mapping source. A manufacturing layer name is not an EDA layer ID. Require one-to-one mapping for a manufacturing signal layer and EDA layer. Without mapping, do not guess a net or claim a default rule is a known net rule. Order and impedance service records come from the caller; the plugin does not independently read the ordering website.

`physicalLayerEvidence` retains raw physical-layer records and `thicknessRaw`. Convert a finite non-negative value to mm using 0.0254 only on EDA 4.1.78 when `thicknessUnitStatus` is `observed-mil-eda-4.1.78`; other versions or invalid values produce no conversion. Source layer order can be returned only when record identity is valid and `zIndex` unique; duplicate indices or conflicting order remain unknown. This source-level conversion/order does not prove manufacturing stackup, manufacturer mapping, nominal/finished thickness, impedance, or order match. The `items` array reports each item as `matched`, `mismatch`, `unknown`, or `not-applicable`, with values, units, sources, and reasons. `overall` may be `mismatch`, `incomplete`, or `matched-within-scope`. Use `matched-within-scope` only for evidence covered by the comparison; it is not a manufacturing guarantee. Keep unknown/incomplete when real calculation or order evidence is missing. Nominal board thickness differs from finished stackup thickness; compare layer thicknesses and copper weights separately. Do not fill dielectric constants from generic FR4 values or present approximate calculations as production guarantees.

References: [JLC impedance and stackup](https://jlcpcb.com/impedance), [JLC impedance calculator](https://jlcpcb.com/pcb-impedance-calculator), and [official rule selector format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/rule_selector.md). Definitions do not prove host behavior or production acceptance.

## Net rules, differential routing, and length tuning

`pcb.createNetClass`, `pcb.renameNetClass`, and `pcb.deleteNetClass` manage net classes; `pcb.listNetClasses` reads them; `pcb.addNetToClass` adds a net. Check current help for member removal. `pcb.createDiffPair` and `pcb.listDiffPairs` create/list pairs; check help for deletion. `pcb.getNetRules` is read-only. `pcb.getNetLength`, `pcb.getNetInfo`, and `pcb.getNetPrimitives` inspect nets; `pcb.highlightNet` helps locate one. Net class, membership, and differential-pair changes are writes; if an outcome is unknown, stop related writes and read back. Rule results can contain unknowns; do not infer inheritance from empty selectors. Confirm a net's own rule only when source, SDK class, and value agree within supported structures. A returned rule is configuration data, not proof of DRC or manufacturing acceptance.

`pcb.routeDiffPair` creates coupled positive and negative polylines from a center path. Check current help. `pair:{positiveNet,negativeNet}` names two distinct existing nets; `path` is the centerline point list; `width` and `gap` are in mil; `layer` must be an enabled SIGNAL layer. `gap` is copper edge spacing; centerline spacing is `width+gap`.

`dryRun:true` previews without writing; omitted or `false` executes. Offset direction follows path direction; reversing points swaps the spatial sides but not the net names. The command removes only geometrically equivalent consecutive duplicate points and same-direction collinear intermediate points; it does not snap or lengthen input. It rejects the pair before writing for reversals, self-contact, insufficient positive/negative spacing, or unreliable values. After execution, read each segment back and check source coverage, non-LINE records, and rules. On partial failure, stop dependent writes; no automatic retry, delete, or rollback. `plannedLengths` describe the requested paths, not total net lengths; bends can make the two sides differ. The command does not avoid obstacles, tune lengths, parallel duplicate pads, create differential rules, or save. Success does not prove connectivity, full-board DRC, reference plane, matching lengths, or impedance.

`pcb.tuneLength` tunes an open routing chain within a region. `net`, `targetLength`, and `region:{xMin,yMin,xMax,yMax}` use current PCB coordinates; units are mil. `targetLength` is the selected chain's total centerline length, not all branches of a net. Use `primitiveIds` to select an open chain with matching net, layer, and width and no locked objects. If omitted, `net` and `region` must contain exactly one candidate straight line. Optional `tunePrimitiveId` selects the segment to replace; other selected segments remain. The region bounds new copper and must fully contain both ends of the tuned segment.

Preview with `dryRun:true`; omitted or `false` writes. `side` is `auto`, `left`, or `right`, relative to the path with endpoints sorted; positive normal is `[-dy,dx]`. `auto` tries both sides and available tuning segments. Failure to find a supported meander does not prove no shape can work. For arc style, explicitly supply `bendRadius`, the arc centerline radius. Also supply finite `lengthTolerance` and `minSelfGap` in mil because the SDK does not reliably map local meander radius, tolerance, or self-spacing. Tolerance is total-length error; self-gap is copper edge clearance between non-adjacent new meander segments. Do not substitute differential spacing or another net's tolerance. `parameterSources` identifies caller values versus unconfirmed rule mappings.

If already within tolerance, response is `changed:false` and no write occurs. A target shorter than current length beyond tolerance errors. Non-zero segments must be at least 1 mil. If the old route has a branch, pad, or via mid-segment, confirm it remains connected after replacement or do not write. After success, compare planned and source-readback lengths for the selected chain. On partial/unknown failure, stop; do not retry, rollback, or save automatically. Geometric success does not prove board-wide spacing, connectivity, impedance, or manufacturability.

## Repeated-pad branches

`pcb.routePadBranches` routes branches to repeated pads on two distinct nets; it is not differential-pair routing. Parameters include `pair:{positiveNet,negativeNet}`, `layer`, `width`, `clearanceMil`, and for each side `{joinPoint:[x,y],branches:[{padId,waypoints?}],trunk?:{primitiveId,endpoint:"start"|"end"}}`, in mil. `clearanceMil` is minimum copper-edge spacing for different nets, not a constant differential gap; zero still forbids contact. The 1 mil minimum applies to non-zero segment length, not trace width.

Resolve starts using real PAD IDs. Without `waypoints`, route directly to the join point; otherwise list intermediate points only. Supported pad shapes are circles, rotated rectangles, plated circular through-holes, and ordinary non-plated outer-layer OVAL capsule pads. OVAL supports horizontal, vertical, and rotated orientations; equal width is treated as a circle, not an ellipse. Prefer valid source dimensions. SDK getters accept exact matches or confirmed nearest 0.1 mil projections and report projection delta. Eccentric/holed OVALs, special layers, and unparseable complex shapes are unsupported. A through-hole route may start within the hole, but its continuous path prefix must then contact the annular ring. Device-pad anchor and geometry conclusions are limited to the SDK model, not embedded footprint-source precision.

Branches on one side may meet at the join or share a continuous suffix after joining. Grazing apart and rejoining, or leaving then returning to a pad, is rejected before writing. `trunk` can target an actual LINE endpoint or a verified ARC endpoint. The plugin checks net, layer, and endpoint; ARC contact is confirmed only when current SDK readback and valid source for the same ID agree. Missing ARC source, failed readback, or mismatch stays unknown and is reported in `arcContactResolution`. The caller does not need a separate curve check to assemble proof fields. Omitting `trunk` means only the branches join; it does not prove connection to an existing trunk. Optional `dryRun:true` previews without a plan token. Writes and readbacks are serial. On failure, completed segments and failure stage are retained; no auto retry, rollback, or save. The host may merge/split LINEs and change IDs; check final geometry coverage instead of redrawing because an old ID disappeared. Results do not establish full-board DRC, native connectivity, or impedance.

## Silkscreen spacing

`pcb.checkSilkscreen` separately checks readable silkscreen objects in the current PCB and manufacturing output. Use current help for scope, parameters, and response. SDK sources may include lines, arcs, and polylines. Distinguish package-local geometry from board-level objects; do not present a local primitive ID as a board-level SDK ID.

SDK candidates screen same-side text, designators, lines, arcs, polylines, and pads by available geometry. Bounding-box overlap calls for review; it is not exact glyph/ink collision. When source mapping is unclear, enumeration incomplete, or geometry unsupported, inspect `coverage`, `unsupported`, and completeness. Do not report candidates with `confirmed:false` or overall `complete:false` as passing. Copper layers and opposite-side objects are not compared.

Manufacturing analysis parses supported Gerber layers and reports side, category, and geometric conflicts; read those results separately from SDK candidates. Complete output means supported syntax parsed completely, not that every font, macro, arc, package source, or board rule was covered. Region totals may differ from independent collision counts. Auxiliary boxes or nearby sources are candidates, not unique manufacturing-source proof. Neither path modifies the board.

## DSN/SES autorouting

The flow is DSN export, service start, status polling, SES retrieval, import-condition checks, SES import, and independent PCB checks. Confirm parameters at each step. Keep the `jobId` from `pcb.autoRouteStart`; poll with `pcb.autoRouteStatus {jobId}`. After `COMPLETED`, call `pcb.autoRouteGetResult {jobId}` for `fileName` and `base64`. Status polling may clear the recent task, so retrieval must explicitly pass `jobId`.

At retrieval, check job identity, file format, Base64, UTF-8, and supported SES structure. Do not alter short segments, coordinates, widths, or drill sizes in the original. Read-only retrieval may be repeated. `COMPLETED` does not mean fully routed; inspect unrouted and violation statistics, and do not interpret missing/empty statistics as zero. Retrieval does not import, delete, save, or run DRC. The service filename is a result filename, not a local path.

Only call `pcb.importAutoRouteSes` after verifying current PCB, net rules, and routing input. Pass original filename, Base64, and required parameters such as drill diameter. Import checks are separate; segments below 1 mil can be preserved at retrieval but are rejected by import rules and are not auto-merged. After import, independently inspect new geometry, nets, layers, rules, and connectivity; save/reopen and run DRC as needed. Service completion, SES counts, or a local check do not prove board-wide routing.

When SES may contain protected existing ARC paths, preserve the `routeBaseline` object returned by pre-routing `pcb.exportDsn` unchanged and use it with that DSN and job. It must match the DSN actually sent to the router; a later export cannot prove the ARC stayed unchanged during routing. Do not use a baseline with `routeBaseline.status` set to `incomplete`, changed PCB identity/source, or an imprecise protected-wire match to resolve SES paths. If a possible existing ARC protection path is present and baseline is absent, import must reject before writing. SES without such paths can follow the regular help-supported path.

ARC protection matching is limited: check current valid ARC source against the actual DSN and check SES wire type, net, layer, width, and complete point list. Split paths, added/missing points, duplicates, edits, changed source, or missing source are not a protected match. A multi-path wire that may mix old protected paths and new routing is rejected before writing. Keep the source file and inspect inputs after rejection; do not edit SES to bypass checks. Successful import confirms only supported writes and geometry checks, not complete rules, board-wide connectivity, or DRC.

Read every `unknowns` item in rule-conformance results; it means neither violation nor pass. Net-class inheritance, empty selectors, and unsupported rules may remain unknown. Check differences between DSN default width and EDA preferred rules separately. `routingConstraintsComplete:false` means the constraint check is incomplete; router success does not prove constraints were satisfied.

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
