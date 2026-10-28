# Schematic workflow

First use [Connection and setup](setup.md) to verify the window, project, and active schematic page. Choose commands from [high-frequency](commands-schematic-high.md) and [low-frequency](commands-schematic-low.md). Read parameters, return fields, and examples from `/help?cmd=<command-name>` for the verified selected window version; `/help` is not routed by the `instanceId` on a write request.

Before writing, read [Schematic operating requirements](原理图操作要求.md) and plan component layout, short-stub spacing, and label direction.

## Inspect and place

1. Use `schematic.getPageInfo`, `schematic.listComponents`, and `schematic.listPins` to identify the page, components, and actual pins.
2. Use `schematic.placeDevice` for a single component; consider `schematic.buildBlock` only for a complete functional block. After placement, verify instance identity, footprint resource, pin numbers, and pad numbers before wiring.
3. Immediate `placeDevice` readback does not prove the component is saved. Without a footprint association or electrical mapping, do not treat successful placement as PCB-ready. A failed post-create check may leave a component behind; inspect the current state and do not replay the creation.
4. For resource anomalies, use `schematic.getPlacementResourcesDiagnostic` to inspect an existing instance. A read-only diagnostic does not prove placement succeeded and does not authorize recreating the component.

## Wires and labels

| Goal | Command | Key limitation |
| --- | --- | --- |
| Connect one pin to a named net | `schematic.labelWire` | Use the actual designator and pin number. Stop if the pin is already occupied by a differently named net. |
| Connect exactly two pins directly | `schematic.linkWire` | Exactly two pins; do not also specify a net name. |
| Make a batch of known connections | `schematic.batchWire` | Check each item and the final netlist; failed items are not automatically repaired. |
| Specify a path or label position | `schematic.drawWire`, `schematic.placeNetLabel` | If `drawWire` already names the wire, do not add a same-name label on top. |

Do not wire NC pins. Manual routes must not cross unrelated pins or overlap collinearly with differently named wires; the host may merge touching wires. A net-label anchor must actually attach to a wire; visual proximity is not an electrical connection. If `placeNetLabel` returns unknown or floating attachment, preserve the current state and stop dependent writes. Source Y coordinates have the opposite sign from public API coordinates; do not pass source coordinates directly to drawing commands.

`schematic.batchWire` does not currently forward `stubLen` from `label` items; the field is ignored. It uses the `labelWire` default stub length of 60 schematic units. To specify a length, call `schematic.labelWire` for each connection and pass `stubLen`; its minimum is 20. Collision handling may still change stub direction or path. These parameter behaviors were checked against v0.20.51 source.

`schematic.linkWire` uses a U-shaped candidate for pins in the same row or column, and an L-shaped candidate when they are in different rows and columns. It checks third-party pins and some collinear wire overlaps, but not component-body boundaries, so a route may cross a component. Inspect the returned `route` and canvas. To explicitly avoid a component, use `schematic.drawWire` with a specified path and verify the netlist and DRC. A passing connectivity audit does not prove that the drawing is unobstructed.

## Modify, organize, and delete

- Verify changes such as `schematic.moveComponent`, `modifyComponent`, `modifyWire`, and `modifyNetLabel` by independent readback, not an SDK boolean. `modifyComponent` submits the complete property object; preserve existing `otherProperty` and do not overwrite project-instance properties with library-device defaults.
- Use `schematic.autoLayout` only to organize an existing functional block. Limit the target and run `dryRun` first; save before executing. Old wires do not follow a moved component; `rewire` deletes and rebuilds related wires. Check wires not reconnected, skipped complex wires, and partial movement. On partial failure, inspect `error.cause.moved` and the current state; do not assume automatic rollback.
- Before `schematic.delete`, verify target IDs and dependencies; rescan after deletion. If a timeout or readback is unknown, stop later deletions. `task.get` can query long-running tasks; a timeout does not mean cancellation. Confirm persistence by saving, closing, and reopening.

## Check and save

Compare expected pins and nets with `schematic.listNets`, `listWires`, `getNetlist`, or `exportNetlist`, then run DRC. Use `structuralAudit` to investigate drawing and connectivity structure; verify the identity of candidate findings such as a frame. On hosts that do not support detailed output, `runDrcDetailed` may return only an aggregate result.

`getNetlist` and `exportNetlist` may cause the host to update designators or Unique IDs, so do not assume they are read-only. Parse any non-empty export. After saving, inspect the full page with `schematic.exportPng` and decode it according to its actual file type; multi-page exports may be ZIP files. Background `editor.screenshot` may be a cached frame. To prove persistence, save, close, reopen, and verify identity, properties, nets, and untouched content.

## Complete component replacement

AI Command Engine has no single command that completes every part of a replacement. The separate module-reuse plugin provides a synchronized replacement workflow. Combine ACE commands only when needed and stop for read-only inspection if any result is unknown. The revised plugin connects only to a bridge whose source-check revision matches and uses the address returned by the module skill; it does not fall back to the old service.

1. Back up the native `.epro2` project with `project.exportFile`. Activate the target page and record the old component's ID, designator, position, mirror state, pins, nets, and project properties to preserve. When reading source, verify the active page's `DOCHEAD.uuid`; split header and body at the first `||`; for each `(type,id)`, use the highest `ticket`; an empty body is a deletion tombstone. Do not treat an old record as current state or pass source Y coordinates directly to the public API.
2. Look up the new component's Device, Symbol, Footprint, pins, and part information. The model, manufacturer, and supplier part number must come from the new component; do not inherit them from the old one.
3. Place a new instance at a location that does not reuse the old designator or association IDs. Verify the new resource source, footprint and per-pin numbers, absolute positions, and net mapping. Do not delete the old component if old and new pins cannot be mapped one to one.
4. If business properties must be transferred, use `schematic.modifyComponent` based on the new instance's complete properties. Preserve the new component's resources and system properties; overlay only explicitly required project properties. Preserve existing custom keys in `otherProperty`.
5. Delete the old ID only after the new instance, connections, and required properties are confirmed. Restore only project identities that must be retained, such as the designator, Unique ID, Channel ID, Group ID, or Reuse Block. `setAttribute` cannot fabricate Device, Symbol, or Footprint associations.
6. Recheck the schematic netlist and untouched objects; save, close, and reopen for verification. The user initiates and confirms PCB updates in the EDA interface; AI performs read-only checks before and after.

## Error repair and macros

For label problems, first locate them read-only, then choose `pruneFloatingLabels`, `fixNetLabels`, `repairNet`, or `dedupeWireNets` as appropriate. Use `dryRun` first when supported. A canvas view alone cannot establish whether labels are floating, net names duplicated, or nets fragmented; check the netlist and DRC after repairs. Source rewrite fallback is not a prerequisite for ordinary repairs; consider it only when explicitly needed and after backing up.

Use `macro` only when all steps are known and do not require an intermediate decision. If any step fails or has an unknown result, stop dependent writes. The macro response key for the step collection is `steps`. Submit steps separately when the next action depends on readback.

**Version-specific checks and command details**

For `schematic.drawWire`, the host may merge adjacent segments into an existing wire. Since v0.20.20, `primitiveIds` means the surviving wire IDs covering the requested path, while `segments` means the number of simple segments executed; also inspect `created`, `reused`, and `removed`. Do not equate segment count or SDK-returned IDs with the number of new wires. v0.20.21 fixed a false pre-write rejection caused by WIRE records without geometry and an associated LINE whose native Y axis is opposite the SDK's. In one adjacent-collinear sample on the current EDA 4.1.78 host, a change to an old wire's geometry and style returned a non-retryable partial result, listed the reused ID, and stopped. The merged state remained after save and reopen.

When the SDK returns `number[]` or `number[][]`, preserve and parse the original grouping; do not flatten first. Use a candidate segment only when it agrees in both directions with the source LINE associated with the same WIRE. Do not infer connectivity across groups. For a simple append that keeps the same WIRE ID, all old LINE records, and adds only requested LINE records, preserve every existing `ATTR` except `zIndex`. Existing `zIndex` values may either remain unchanged as a group or all increase by the number `n` of added LINE records. `n` must be a finite integer; preserve the relative order of existing ATTR records by zIndex and record `drawingOrderChanges`. Continue strict checks of the WIRE itself and all non-target objects; reject other differences. In a v0.20.34 host sample adding a third adjacent segment, the original LINE records, net, and style were preserved; `drawingOrderChanges` matched the observed change, and effective records matched after save, close, and reopen. This covers only that simple append shape.

The v0.20.35 candidate accepts an SDK-added empty NET plus Relevance on a new WIRE only when no `net` was passed to `create` and geometry and style have already passed. The ATTR header ID must be valid, `parentId` must be the new WIRE, and the key must be NET. Only the NET value and `getter.net` must be empty strings; verify Relevance under its separate rules. Continue strict checks for old WIRE records. Explicitly named segments must match request, source, and getter. `named:false` remains unnamed. An echoed `net` is only an input echo; it does not prove that a separate segment belongs to a net. Do not add a name or label and do not retry. Source and real-fixture regressions passed expert review; host acceptance of the candidate remains pending.

If post-write source IDs and SDK IDs disagree during A08, only resample read-only within the command's remaining total time. On every sample, verify focus, source, and model together. After timeout or a late result, do not read or write again. Bound both initial and later reads. Do not retry create, modify, or delete, and do not continue with later segments. Once IDs agree, still verify all geometry, nets, and styles. If they remain inconsistent, return `partial` with both ID sets and sample times. Check the actual page; do not redraw automatically. Other wire paths require separate acceptance.

**Modify and delete safeguards**

Before changing wires, verify the full target batch and source. Distinguish missing NET attributes, empty NET attributes, and non-empty NETs. In a single SDK call, pass the complete color, width, and line type, using verified original values for properties not requested. Explicitly pass `net:''` for an existing empty NET, and do not add a net name to a wire with no NET attribute. If the getter reports a source NET under the same ID as `Name`, accept it only after checking ID, value, and parent ownership. Reject true Name-only records, duplicate attributes, and conflicts before writing. After each wire and at the end of the batch, verify the objects, source NET attributes, and each LINE's ID, endpoints, and style. On failure, stop and attempt full-page recovery; if recovery is unconfirmed, stop relying on that result. On the current host, v0.20.18 empty-NET single-wire and two-explicitly-same-name batch color changes passed save/reopen. Since v0.20.19, active line-type changes accept only the pre-write-verified values `0/SOLID`, `1/SHORT_DASH`, and `2/DOT`; verify the target code after writing. Single named-wire solid-to-dash-to-dot-to-solid changes each passed save/reopen on the current EDA 4.1.78 host. Complex multi-segment wires have not been accepted. In a P4 host batch sample, only the `strokeStyle` of two named A wires changed from dotted to dashed; a third empty-NET wire and other non-target content remained unchanged, including after save and reopen. The current API cannot express a strict getter filter for `net` on a mix of empty and non-empty NETs; this is not applicable and is not counted as an untested check.

For `schematic.autoLayout`, use it only to arrange an existing functional area. Limit its scope, run `dryRun`, and save before execution. Wires do not move with components; `rewire` deletes and rebuilds related wires. Check wires that were not reconnected, skipped complex wires, and partial movement. On partial failure, inspect `error.cause.moved` and the current state; do not assume rollback.

Before `schematic.delete`, verify target IDs and dependencies and rescan afterwards. On timeout or uncertain readback, stop further deletes. `task.get` can query long-running tasks; a timeout does not mean cancellation. Save, close, and reopen to check deletion persistence.

**Input validation, DRC, and exports**

`schematic.listComponents.allPages` and `schematic.structuralAudit.allPages` must be booleans. `schematic.structuralAudit.ncExempt` must be a string array. `schematic.structuralAudit.deviceMargin` defaults to 10 mil and, when supplied, must be a finite number greater than or equal to 0.

`schematic.exportPng` width and height must be integers from 1 to 4096; omitted values use the command defaults.
`schematic.pruneFloatingLabels.dryRun` and `schematic.fixNetLabels.dryRun` accept booleans only. If omitted, `pruneFloatingLabels` performs cleanup, while `fixNetLabels` previews only.

Since v0.20.29, the candidate also validates `listNets.detail`, `pruneFloatingLabels.allowSourceRewrite`, and `repairNet.dryRun` strictly as booleans, rejecting other values before reading or writing. The existing default behavior of each parameter is preserved. These new checks still await acceptance on a newer host.

Compare expected pins and nets with `schematic.listNets`, `listWires`, `getNetlist`, or `exportNetlist`, then run DRC. `structuralAudit` helps investigate drawing and connectivity; verify the identity of candidate findings such as frame objects. `runDrcDetailed` may report each finding or aggregate it according to the structure actually returned by the host; individual findings were tested on EDA 4.1.78 and must not be inferred from version alone. One initial frame sample also returned `strikeout:false` on 10 ATTR records; keep this as a separate observation and do not relax checks for other objects. The closing audits in `runDrc`, `runDrcDetailed`, and `buildBlock` return “result cannot be determined” for a non-array or unknown DRC structure. `buildBlock` places the reason in `auditError`; do not treat that as a pass. If counts differ between two checks immediately after save, wait for topology refresh and query again.

For `schematic.exportBom(fileType=csv)`, preserve the host's original file bytes. Read returned `format`, `encoding`, and `delimiter` before parsing. On EDA 4.1.78, `.csv` was actually UTF-16LE tab-delimited text, not UTF-8 comma-separated CSV. `fileName` may include the matching suffix or omit it; the plugin avoids adding a duplicate suffix. Confirm XLSX files by their ZIP header. If the format cannot be confirmed, inspect the original file using the returned `note`.

On EDA 4.1, `listNets` uses PADS netlist and named-wire fallbacks. Automatically named nets may be listed, but `detail:true` cannot always associate unnamed wires with the matching auto-net; use `getNetlist` to verify pins. If fallback is unavailable, the command returns an error. Point and region primitive queries require EDA 4.2 or later.

On EDA 4.1.78, `schematic.modifyText` may read back successfully immediately, but its content and position revert after save and reopen. The plugin rejects this command on 4.1.78. It requires EDA 4.2 or later; persistence on 4.2 has not been verified. Region and point primitive queries also require 4.2; see [the low-frequency command list](commands-schematic-low.md#eda-version-limitations) for the exact names.

`getNetlist` and `exportNetlist` may cause the host to update designators or Unique IDs, so do not assume they are read-only. A non-empty export still needs to be parsed. After saving, inspect the full page with `schematic.exportPng` and decode it according to the actual file type; multi-page exports may be ZIP archives. Background `editor.screenshot` may show an old frame. To establish persistence, save, close, reopen, then verify identities, properties, nets, and untouched content.

**Complete component replacement: workflow scope**

AI Command Engine has no single command that completes every part of a component replacement. The replacement model, footprint, and pin mapping must be confirmed jointly by AI and a person. The separate module-reuse plugin performs synchronized schematic and PCB replacement. Its `prepareReplacement`, `executeReplacement`, and `getReplacementOperation` methods use `module-reuse:rpc:v1`, not ACE HTTP commands. Versions with a built-in Gateway start the bridge in the module skill in the background; they do not require separately installing Gateway or AI Command Engine. Copper, keepouts, and custom openings are finishing repairs after reuse. The numbered process above describes using ACE commands alone; if any step has an unknown outcome, stop and inspect read-only first.

## v0.20.62 named red-solid two-segment T-junction

On a new EDA 4.1.78 page, a bounded sample passed through save/close/reopen: connect from the outer end of a polyline into the interior of an existing horizontal segment. The named, styled old two-LINE wire became four LINEs. The candidate must match the full multiset of old and new segments, allowing reassignment of old IDs; WIRE, style, NET, and non-target objects remain unchanged. Only a unique NET's `zIndex` change from 5 to 9 and `Relevance` change from 4 to 8 are allowed and recorded in `drawingOrderChanges`. Reverse-direction connections and multi-WIRE merges are unverified and do not widen acceptance; input paths are not automatically reversed.

## v0.20.61 T-junction diagnostic record

In an independent installed-package sample, a named T-junction `create` returned normally in about 18 ms, and complete source for the same WIRE matched the getter. The first validation explicitly rejected an ATTR `zIndex` change that did not correspond to simple LINE additions. The outer call returned `heartbeat-fuse` after about 15,722 ms, with the stage-diagnostic snapshot written in full to the lane log. That snapshot is only the last reported state and may not be current. It proves diagnostics captured the first validation failure; it does not prove the T-junction write passed. The 40 ms resampling pause did not use an absolute deadline; logs stopped at first validation. Do not infer the SDK timer or native resolver was the cause.

## v0.20.60 T-junction observations (not accepted as passing)

Two independent samples did not establish that a named multi-segment T-junction passed. In saved project `907894...`, creation failed after 4 ms, diagnostics did not reach post-check, and effective records were unchanged. In unsaved page `dba2...`, the call reported `heartbeat-fuse` after 15.353 seconds, but T-junction geometry had appeared; whether creation returned or post-check ran is unknown. Do not identify `zIndex` as the cause. Stop further writes in both pages and the current window; do not upgrade or close them.

## v0.20.58 limited installed-package samples

Two different-net short stubs that would have met at the same point were automatically routed in opposite directions. The end-of-batch audit and the netlist after save/close/reopen retained separate nets. A U-shaped connection between two same-direction pins read back as an outer detour and remained connected after save/reopen. These are geometry and electrical samples; they do not establish collision avoidance for arbitrary symbol bodies or full drawing acceptance.

## v0.20.57 lock behavior

With v0.20.57 and its companion proxy, a historical `partial`, timeout, or recovery failure no longer leaves a persistent lock on the window. Later independent requests do not require manual unlocking.

## v0.20.55 TEXT deletion and wire compatibility (limited host acceptance)

TEXT deletion uses the official `sch_PrimitiveText.delete` and checks target source, model, and non-target content. If the return is unknown or readback incomplete, stop; do not automatically switch to a whole-page source write. Successful readback still does not prove save/reopen persistence. On two independent EDA 4.1.78 pages, the target disappeared immediately from source and model but returned under the same ID after save/reopen; one case had a saved baseline and still reproduced after about five seconds both after deletion and after saving. Persistence failure is known; `directDeleted` is not final deletion. Do not retry or compensate. The user chose to retain TEXT deletion with help documenting the current-version persistence failure instead of disabling it.

`schematic.drawWire` may return `partial` due to host merging, property reordering, or delayed readback. This means the result of that write is uncertain; it does not mean later writes remain locked. On EDA 4.1.78, v0.20.55 verified the default line, collinear extension, and a vertical T branch into one horizontal line's interior, including save/reopen. Target effective records persisted and the entire page's effective records matched on the second pass. This covers only those shapes, not named lines, multi-segment lines, or multi-WIRE merges.

## v0.20.54 unnamed T-junction adaptation candidate

For the narrow shape of an unnamed default horizontal line with a vertical branch into its interior, verify all of: full splitting of the original line, requested branch, default style, empty net, rebuilding the empty label at the branch midpoint, `Relevance` identity, and the observed ordering change. Preserve all other effective records. Do not allow arbitrary `zIndex` changes. Final read-only checking must not count a newly created single line again as reused. The v0.20.54 host retest still failed because the adaptation expected getter line type `0`, while the current host default was `null`.

## v0.20.53 batchWire short-stub candidate

For v0.20.53, `schematic.batchWire` passes through `stubLen` on each `label` item; the default is 60, minimum 20, in schematic coordinate units. Reject an invalid length before writing any item in the batch. Confirm each new stub's complete source LINE and SDK target-net readback before starting the next item. If confirmation remains impossible, return non-retryable `partial` and stop the batch; `continueOnError` must not continue past an uncertain write. Collision avoidance may change stub direction. Crossings, overlaps, or shared endpoints with different-net wires are not safe candidates. Older versions may ignore per-item `stubLen`; use help from the target window.
## Current schematic-grid lookup limitation

No public schematic-grid getter has been verified for EDA 4.1.78 / SDK 0.4.26. After the test page was changed to 0.1 inch (100 mil) in the UI, the complete source stayed unchanged except for DOCHEAD metadata; CANVAS contained only `originX/Y`. No `schematic.getGrid` command was added.

Before arranging or wiring to a grid, confirm the actual grid and snap interval in the EDA UI, and obtain the value and unit from the user. Do not treat the schematic API coordinate unit of 10 mil as the grid interval, or apply PCB CANVAS fields to a schematic. If the current value is unavailable, state that it is unknown; do not assume 50 mil.

## v0.20.106 schematic feedback fixes (partially host-tested; reported defect retained)

`schematic.setAttribute` retains one modification and the existing 300 ms wait, using the EDA host timer. Diagnostics distinguish modification, waiting, and readback, and record only the stage and elapsed time, not attribute values. Parameter or target lookup failures remain pre-write failures. Exceptions after modification starts, timer failures, or unconfirmed readback return `partial` with `retryable=false`. First check the actual attribute and original-call state; do not replay the modification directly. The host timer does not prove that all SDK hangs are fixed.

`schematic.drawWire` preserves existing zero-length points exactly while still rejecting new zero-length requests. Legal display `zIndex` changes are checked independently; do not infer display order from the number of new LINEs. Automatic NET/Name/Relevance reconstruction is checked only against the geometry, net source, ownership, and valid fields of wires affected by this call; duplicate equal values are not automatically cleaned up. Cross-net label transfer, conflicts or unrequested nets, orphan labels, damaged geometry or style, and unrelated content changes remain rejected. v0.20.106 uses per-segment accumulation; it was found that created or deleted ATTRs could remain in the report, and v0.20.107 corrected this to strict net changes from initial to final state. Existing narrow T-junction adaptation and full post-checks remain. Ordinary custom properties must retain their original ID, ownership, and complete content when wires merge; if the parent wire changes, the command conservatively returns `partial`. This release does not add ordinary-property migration.

`schematic.exportPng` distinguishes host generation from file encoding. `schematic.getNetlist` retains its 45-second wait budget and distinguishes an outer timeout from the original host call actually ending; a late return does not mean a second call was issued. Logs do not record image or netlist content. A timeout does not mean cancellation; do not retry because of a timeout message alone. Check the original call before scheduling follow-up work. Netlist generation may update designators, Unique IDs, or save the project, so it is not a purely read-only source.

Source changes, simulated regressions, packaging, and installed-package acceptance are recorded separately. Background PNG export succeeded in this release. A JLCEDA host hang was reproduced, but its root cause remains unknown; diagnostics do not prove the cause was fixed. Results from the author's older local package do not replace installation and save/reopen acceptance of this release. The first wire on a new A1 page remains deferred until the EDA upgrade, as the user decided.

## v0.20.107 display net changes and unconfirmed netlist results (limited host acceptance passed)

`schematic.drawWire.drawingOrderChanges` compares only the initial pre-write snapshot with the final verified snapshot. It reports an ATTR only when it exists in both, has the same ID and parent WIRE, and has a net change in integer `zIndex`. Newly created, deleted, rebuilt under a new ID, or restored-to-original-value items are omitted. Only report calculation changed; geometry, electrical post-checks, and SDK call count did not.

After the host call for `schematic.getNetlist` starts, a wait timeout or host rejection returns `partial=true`, `retryable=false`, plus `operation`, `phase`, and `hostOperationState`. The existing macro entry point stops dependent steps even when `stopOnError:false`. The 45-second wait and late-original-call diagnostics remain; there is no retry, added lock, or assumption of cancellation. A preflight focus failure remains an ordinary error with zero SDK calls.

In an independent EDA 4.1.78 copy, v0.20.106's tested attribute modification, two-segment named wire, and extension passed limited checks. The first save/close/reopen preserved 80 effective records, which remained so after reconnect. Background attribute modification took 1.261 seconds; PNG export succeeded in 3.618 seconds and returned a ZIP containing two PNGs. The historical PNG hang did not recur in this run; this does not prove it is fixed.

In the same copy, a single JLCEDA netlist call timed out at 45.004 seconds and remained pending after bringing EDA to the foreground; no prompt was seen during the 45-second observation. The SDK later rejected the original call at about 300.445 seconds; underlying cancellation is unverified. JLCEDA is a valid enum value. The old API is officially deprecated and the recommended file API is still Beta, so do not switch APIs automatically to conceal failure. The root cause remains unlocated. Do not write, save, switch projects, upgrade, or resend in the unresolved window; isolate a new acceptance run in a separate window. v0.20.107's tested display report and save/reopen of 81 data records passed; the netlist failure classification was validated only by simulation.

## v0.20.108 JLCEDA string netlist path (limited host acceptance passed)

The public inputs and `netlistType`/`length`/`netlist` returns of `schematic.getNetlist` remain unchanged. Only when `netlistType` is exactly `JLCEDA`, the command selects the existing official `sch_ManufactureData.getNetlistFile(undefined, 'JLCEDA')` path at call start, reads `File.text()`, and returns the string unchanged. `length` remains JavaScript `string.length`, not UTF-8 byte length. With no type, Protel2 remains the default; other formats retain the original string SDK path.

This branch does not call the old SDK first, fall back after failure, or regenerate the file. A missing file, missing callable `text` method, rejected text read, non-string, or whitespace-only result cannot succeed. File generation and text reading share the existing 45-second total wait. Stage diagnostics distinguish generation from text reading and do not log netlist contents; late logs correspond to the original full read Promise. An unconfirmed failure after invocation remains `partial`/`retryable=false`, and dependent macro steps stop even with `stopOnError:false`. Blank or non-string results from other formats also become post-call `partial`. A timeout does not mean the operation was canceled; no lock or size limit was added.

File generation may update designators, Unique IDs, or save the project, so it is not purely read-only. This is the existing path used by `exportNetlist`; the old string API is deprecated and the recommended file API remains Beta. This is a preselected JLCEDA path, not a claim that Beta is production-guaranteed for every version or an unverified substitution for other formats. See [the old API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_netlist.getnetlist.html) and [the file API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_manufacturedata.getnetlistfile.html).

The v0.20.107 host file API returned a 6,664-byte `.enet` JSON file in one call; R107/R2 four-pin nets were correct, and P2 plus 81 data records were unchanged before and after. The formal v0.20.108 `getNetlist(JLCEDA)` run passed immediate and save/close/reopen checks in 56/25 ms; the returned string matched the official file netlist JSON and four pin nets were correct, with 81 effective data records preserved. The old v0.20.106 SDK call was rejected late at about 300.445 seconds, which does not prove that the underlying operation was canceled. The active document identity later changed; page data was not judged by comparing across documents, and the observed state was retained.
