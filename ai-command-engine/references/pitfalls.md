# Operational Risks and Result Interpretation

This page covers risks that cannot be judged from `/help` parameter tables alone. For routine operations, see [schematic commands](commands-schematic.md), [PCB commands](commands-pcb.md), and [library commands](commands-lib.md).

## Write Results

- SDK success, a non-empty ID, a screenshot, or zero DRC errors alone does not prove completion. Verify through plugin readback and target content; save, close, reopen, and read again when persistence matters.
- A timeout does not cancel a write. If the result is unknown, stop dependent work and inspect with `task.get`, a list command, or valid document source. Do not resend blindly.
- After deletion, a single object's `get()` may return cached data; use the full list or valid source to confirm. After creation, a list may temporarily omit the item; also check the returned ID.
- There is no general undo API. Before destructive operations, confirm a backup file was actually created. Closing a tab and choosing “Don't Save” does not guarantee rollback.
- An immediately deleted `TEXT` may reappear with its original ID after save and reopen. Immediate deletion status does not prove persistent deletion. If readback is incomplete or unknown, stop; do not write back the entire page source, retry, or compensate.
- A successful `save` in a headless environment does not prove the file reached disk or that the plugin supports headless operation.

## Windows and Documents

- Include the currently verified top-level `instanceId` in every `/command` request. `/help` reads from the globally selected window, so check parameters on the target window.
- `project.create` and `project.open` switch the active project. Before switching, decide how to handle unsaved changes, then verify with `project.getInfo`.
- `project.getDocumentSource` reads only the active document. Open the target page and check `DOCHEAD.uuid` first. Source coordinates are not public API coordinates; schematic Y is reversed.
- Interpret source logs by effective records. Old records and deletion tombstones do not represent current state.
- `project.modifyTitleBlock` changes existing fields only. An accepted request does not prove the save took effect. This API cannot change paper size or frame symbols.

## Schematics and Netlists

- When placing a specified `deviceUuid`, also provide its matching `libraryUuid`. Immediate placement checks do not replace save/reopen, netlist, and PCB-availability checks.
- When modifying a component, preserve existing properties and `otherProperty`. An empty footprint, bare footprint name, or missing resource reference may break the netlist; check that all components are present after export.
- Route wires clear of third-party pins and collinear wires on other nets; the host may merge touching wires. A named `drawWire` does not need an extra same-name label. Verify label attachment through its ID, parent wire, and properties; visual proximity is not connectivity.
- `getNetlist` and `exportNetlist` may update designators or Unique IDs, or save the project; they are not necessarily side-effect-free reads. JLCEDA types use the file-generation channel. If the call fails or times out, do not fall back or resend until its outcome is known.
- `dedupeWireNets` removes duplicate same-name attributes on the same wire; it does not resolve conflicting names by choosing a net. Rebuilding may change graphic IDs, so query them again afterward.
- For a full component replacement, follow the [schematic command sequence](commands-schematic.md): place and verify the new part before deleting the old one. The user starts and confirms PCB updates in the EDA interface.
- Prefer `schematic.exportPng` for visual checks. A background `editor.screenshot` may show an old frame.

## Libraries and Project Tree

- Library resource UUIDs may change after edits. Use the UUID in the response and fresh `get` or search results. `verify:"none"` means the SDK update returned success but readback was not confirmed; do not report it as verified or automatically write or retry again.
- If `libraryUuid` is omitted, `lib.*` queries default to the personal library. `footprintGetSource` is an exception: without it, the query searches the project library and then the personal library; with it, only the specified library is searched. `library.searchDevice` uses the SDK default search scope. Specify and verify the library UUID when restricting the source.
- A component's existence does not prove it has a footprint or can transfer to PCB. Check `footprintUuid`, symbol-pin to footprint-pad mapping, and the actual scope stated by diagnostic or placement results.
- UUIDs may be regenerated after project recovery or import. Compare pages, components, nets, and required resources; UUID equality alone is not sufficient.
- An empty response or exception from `project.importFile` leaves the outcome unknown. Check the target name, directory, and project tree. A matching name alone does not prove success; do not import again blindly.

## PCB

- PCB DRC does not check all component-body and silkscreen overlaps. `checkPlacement` approximates with pad bounding boxes; skipped objects or `complete:false` mean placement has not passed.
- A copper-pour outline does not mean it has been filled. Do not interpret `filled` unknown as empty or complete; after repouring, check the saved state and target region.
- `ComponentPad.getConnectedPrimitives` does not return `Poured`, so it cannot prove whether a pad contacts filled copper.
- Autorouter back-annotation may clear unlocked tracks. Check the task, lock scope, and back-annotation result first. Do not apply the same clearing assumption to ordinary SES imports.
