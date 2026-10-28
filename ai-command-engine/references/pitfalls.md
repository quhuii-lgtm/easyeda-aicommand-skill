# Important operational pitfalls

This page covers risks that cannot be determined from `/help` parameter tables alone. Standard workflows are in [schematic](commands-schematic.md) and [PCB](commands-pcb.md).

Do not send users plugin checks that have already completed independent readback. Only add checks for objects, save state, and design quality that remain uncovered.

## Results and write state

- Since v0.20.57 and its companion proxy, past failures no longer leave a persistent lock on later independent requests; `write.acknowledge` is not required. It is retained only for compatibility as a success receipt. It does not clear the queue, cancel a task, or prove an older write succeeded. Normal use does not need to call it.

- An SDK `true`, a non-empty ID, a single screenshot, or a DRC result with no errors alone does not prove the task is complete. Use plugin readback and the required save/reopen checks for the task.
- A timeout does not cancel a write. If the result is unknown, stop dependent writes and inspect with `task.get`, current lists, or document source read-only. Do not blindly resend or clear write protection yourself.
- After deletion, a single-object `get()` may return a cached old object. Check existence with a full list or rescan of effective source. After creation, a list may temporarily omit the item; check using the returned ID as well.
- There is no general undo API. Before destructive work, confirm the backup file was actually created. Closing a tab and choosing “Don't Save” does not guarantee rollback.

## Windows, projects, and documents

- Include the currently verified top-level `instanceId` in every `/command`. `/help` uses the globally selected window; do not copy parameters across versions. After a window or document switch times out, reread identity.
- `project.create` and `project.open` switch the active project in the current window. Handle unsaved changes first, then verify the project with `project.getInfo`.
- `project.getDocumentSource` may return the current page when the target is not active. Run `editor.openDocument` first, then check `DOCHEAD.uuid`. The schematic Y axis in source coordinates has the opposite sign from the public API.
- `project.modifyTitleBlock` can change only fields already present on the current page. First inspect `getPageInfo.titleBlockData`; an accepted submission does not prove the change took effect after saving. It cannot switch paper size or symbol.
- Determine object state from effective source records; old records and deletion tombstones are not current state.

## Schematic

- When `placeDevice` uses `deviceUuid`, it also requires `libraryUuid`. Immediate placement verification does not replace save/reopen or netlist checks.
- Preserve the component's complete existing properties and `otherProperty` when modifying it. An empty footprint string, bare footprint name, or missing association may cause netlist problems. After netlist export, check that no components are missing.
- Do not route wires through unrelated pins or overlap differently named wires collinearly; the host may merge them. Do not add a same-name label on a `drawWire` that is already named. Confirm label attachment using this label's ID, its parent wire, and attribute readback; visual proximity is insufficient.
- `getNetlist` and `exportNetlist` may cause the host to update designators or Unique IDs. Consider this side effect first if the source must remain strictly read-only.
- `dedupeWireNets` handles duplicate same-name attributes on a single wire only; it does not decide conflicts between different names. Rebuilding changes primitive IDs, so query them again.
- Follow [Complete component replacement](commands-schematic.md): place and verify the new component before deleting the old one. The user initiates and confirms PCB updates in the EDA interface.
- Use `schematic.exportPng` for visual inspection; background `editor.screenshot` may be a cached old frame.

## PCB and libraries

- `ComponentPad.getConnectedPrimitives` does not return `Poured`; it cannot establish whether a component pad does or does not contact actual poured copper.

- PCB DRC does not check all body-to-body and silkscreen overlaps. `checkPlacement` is an approximation based on pad bounding boxes; skipped objects or `complete:false` do not mean placement passed.
- The presence of a copper-area outline does not prove that it has been filled. If `filled` is unknown, do not treat it as empty or complete. Even a successful refill must be checked against saved state and the target area.
- Autorouting import-back may clear unlocked tracks; inspect the task, lock scope, and import-back result first. Do not apply the same clear-track assumption to ordinary SES imports.
- A library UUID may change after editing a resource. An official API error may occur after a write; search and read back the target before proceeding, and do not blindly retry with an old UUID.
- UUIDs may be rebuilt after project recovery. Compare pages, components, nets, and required resources; UUID equality alone is not sufficient.
- If `project.importFile` returns empty or throws, treat the result as unknown and inspect the current state. Do not infer success from the project name or import again.

## v0.20.106 schematic feedback fixes (partially host-tested; reported defect retained)

Do not resend when properties changed but the response did not complete. A PNG or netlist timeout does not mean the host canceled the call. Check the relevant stage, original call, and actual project state. The netlist API may update designators or Unique IDs and save the project. Diagnostics were added; this does not establish that every background hang is fixed. See [Schematic workflow](commands-schematic.md).

## v0.20.107 display net changes and unconfirmed netlist results (limited host acceptance passed)

A valid JLCEDA netlist call timed out once on EDA 4.1.78; the SDK rejected it late at about 300.445 seconds, while the underlying effect remained unconfirmed. Do not save, switch projects, upgrade, or resend in that unresolved state. v0.20.107 corrected partial reporting for unconfirmed results and display-change reporting, but did not establish the host-hang root cause. See [Schematic workflow](commands-schematic.md).

## v0.20.108 JLCEDA string netlist path (limited host acceptance passed)

The JLCEDA netlist path reads text from the existing file-generation API and preserves the original string contract. On error, it does not switch to the old API or generate the file again. An unconfirmed file or text stage returns `partial` and stops dependent steps. The path may update the project, so do not treat it as purely read-only. Limited v0.20.108 acceptance is documented in [Schematic workflow](commands-schematic.md).

## v0.20.109 B2 acceptance boundaries (limited host acceptance passed)

- OVAL uses capsule geometry from axial standard O or an exact oval macro at any rotation. A zero core length exports as C; C/O/Oval representations are treated as competing matches. Non-grid values use exact matching. If parameter precision is unknown, retain uncertainty and do not identify a unique association from other candidates.
- A non-circular ELLIPSE retains source `height`, but EDA 4.1.78 runtime renders it as a circle based on `width`; do not claim true ellipse support.
- Dual-side layer-12 openings match only confirmed NORMAL, expansion, default-shape, and unique outer-layer SPECIAL override rules. Unknown or overridden cases remain skipped. Hole records do not prove drilling or connectivity, and solder mask does not subtract holes.
- `geometry-correlated` is not a unique source. Preserve `complete=false`, BOX `confirmed=false`, and unknown whole-board DRC/font combinations. The supported subset passed formal commands and save/reopen; uncovered configurations are not accepted.

See [PCB shape and opening topics](commands-pcb-special.md#020109-b2-capsules-and-double-sided-solder-mask-openings-bounded-host-acceptance-passed).

## v0.20.110 B2 acceptance boundaries (partially host-tested)

- For closed state, use `observed-no-positive-area-opening`, `unattributed-opening-present`, or `geometry-match-uncertain`. Return `not-evaluated` when the target Gerber layer is not unique or complete. The check is read-only; do not describe getter readback as a write.
- The ordinary null-expansion R1 path passed on the original board; this says nothing about the no-net branch. Explicit source/runtime conflicts report `overrideNeeded`.
- The R2 three-shape unique-key path restores exact source values; 0.1 mil applies only to the SDK shape getter. Duplicate layer keys use the raw interface for the same PAD net and strictly verify ID, parent, layer, PAD type, and net. Missing, duplicate, or mismatched values remain unknown; do not guess source precedence.
- Raw `top`/`bottom` mean physical sides; `inner` is used only for a combined bounding box. `width/height × 10 mil` is only an exact source-geometry comparison; only `ratio=0` with `innerpl=null` is supported. Standard 1/12/2 normalization is not overridden by raw values.
- A/B large-OVAL range settings show that `inner` participates in the bounding box while the outer layer remains default. Do not generalize to all range overrides. Only tested paths partially passed host acceptance; replay and automated tests do not prove the no-net branch or full B2 support.
- Native modification samples are missing for the source association between instance geometry and solder-mask coverage. The user chose to retain this as a known limitation for now. Manufacturing checks continue; this source association is not accepted.

See [remaining PCB topics](commands-pcb-special.md#020110-remaining-b2-work-partially-host-accepted).

## v0.20.111 no-net query host history (failed at the time; completed in v0.20.112)

- In v0.20.111, the empty-net query for `rangeinner A` returned an empty array. The formal check then covered 8 of 20 face associations. This records the historical state of v0.20.111 only.
- The limited v0.20.112 acceptance completed 12 formal checks across six projects. See [PCB topics](commands-pcb-special.md#020112-b2-empty-net-dsn-adaptation-host-acceptance-passed).

## v0.20.112 B2 no-net DSN adaptation (host acceptance passed)

- Six projects had 220 cumulative checked faces, including repeat checks after save/reopen. All 72 DSN-derived faces were associated. Manufacturing data, source, and rules were stable across runs; `task0`.
- Select DSN `outer` by same-PAD identity. A shared stack is allowed. Missing, duplicate, identity collisions, or precision ambiguity remain unknown. Gerber is only an independent check and is not used to choose a DSN candidate.
- Preserve unknown for 15 precision-ambiguous faces; do not treat them as association defects. Whole-board production acceptance and complete source localization are outside this result.

See [PCB no-net DSN topic](commands-pcb-special.md#020112-b2-empty-net-dsn-adaptation-host-acceptance-passed).
