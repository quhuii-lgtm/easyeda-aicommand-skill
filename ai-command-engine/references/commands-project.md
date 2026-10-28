# Project and Page Commands

Use `/help?cmd=<command>` in the verified target window for parameters, responses, and examples. Each `/command` request includes `cmd`, the current top-level `instanceId`, and required `params`; macro steps inherit that instance. Read document-tree UUIDs from `project.getInfo`; do not guess them.

## Projects

- `project.getInfo` reads the current project and document tree; `project.getInfoOf` reads a specified project. `project.list` optionally accepts a non-empty `teamUuid` (pass unchanged) and Boolean `detail` (default `false`). Without `detail`, it returns UUIDs; with `detail:true`, it returns ordered `{uuid, info}` entries. An empty result only describes that query. On unexpected results, check the query scope and team.
- `project.create` creates a project. `project.open` switches to a specified project. Before opening, save the current project or confirm that unsaved work can be discarded; valid targets do not preserve unsaved content in the old project.
- `project.moveToFolder` moves a project; an empty folder means the root. Check project UUID and location before and after.
- `project.exportFile` exports native `.epro` or `.epro2`; `fileType` accepts only `epro` or `epro2` and defaults to `epro`. Project download permission is required. Export success does not verify contents.
- `project.importFile` imports a base64 file and creates a project. Supported formats include `.PcbDoc`, `.SchDoc`, `.epro`, and `.epro2`; `fileType` may be inferred from the extension. Check for duplicate names in the current team. For online `.epro2`, an omitted `newProjectName` is derived only from root `project2.json.title`; the importer does not guess from the filename, append a suffix, or overwrite a same-name project. Provide a name if derivation is unavailable or conflicts. For online `.epro2` only, root `description` is copied as-is. Import is Beta; lossless import and saved PCB routing/copper are not guaranteed.
- If import returns empty, errors, or no valid project UUID, treat it as `partial:true`, `retryable:false`, `outcome:unknown`. Search by target name and folder before taking any further action. Check project contents after a successful response too.
- `project.getDocumentSource` reads only the active document and takes no UUID. Confirm document focus and identity; source coordinates are not public API coordinates.
- `project.modifyTitleBlock` changes existing title-block fields only. Read `titleBlockData` with `schematic.getPageInfo`; keys in `data` must already exist, and omitted fields retain their values. `modified:true` means the host accepted the submission, not that it was saved or read back. Page Size and Symbol cannot be changed here.

## Boards and association

- `project.getBoardInfo` checks associations between a Board, schematic, and PCB. `project.associateBoard` creates an association; if the write result is unknown, stop dependent writes.
- `project.copyBoard` copies a Board. `project.deleteBoard` deletes one; `project.renameBoard` renames by matching name. If names collide, identify the target with `getBoardInfo`. Verify and back up before deletion.

## Schematics and pages

- `project.createSchematic` creates a schematic. If `boardName` is supplied, it must name an existing Board; otherwise associate it later with `associateBoard`.
- `project.createSchematicPage` creates a page under a schematic. Its required `schematicUuid` is the parent schematic UUID, not a page UUID.
- `project.listSchematicPages` lists current project pages and UUIDs. Read document-tree UUIDs using `project.getInfo`.
- `project.copySchematicPage` uses `pageUuid` for the source; optional `schematicUuid` selects a parent, defaulting to the same schematic. The new name may be generated as `source_N`. Check returned new UUID, name, parent, and source. If the SDK returns an empty UUID, the source UUID, or readback fails, treat as `partial:true`, `retryable:false`; inspect the project tree without retrying or masking the unknown result.
- `project.renameSchematicPage` renames by `pageUuid` and `name`. The plugin opens and activates the target, attempts to save, then reads it back. `renamed:true` confirms readback. `renamed:false` with a `note` means the host accepted the request but readback did not confirm it; check later with `listSchematicPages`.
- `project.reorderSchematicPages` requires `schematicUuid` and the complete `pageUuids` array in the intended order.
- `project.deleteSchematicPage` deletes a verified page. Confirm UUID and back up first, then rescan the project tree. Stop further deletions if the result is unknown.

## PCB documents

- `project.createPcb` creates a PCB. A supplied `boardName` must match an existing Board.
- `project.copyPcb` requires source `pcbUuid`; optional `boardName` assigns the copy to an existing Board with an empty PCB slot. Omit it to create an unassociated PCB. Check returned UUID. Empty SDK responses or exceptions mean unknown outcome (`partial:true`, `retryable:false`); inspect with `project.getInfo` and `project.listPcbs` before proceeding.
- `project.listPcbs` lists PCBs. Verify target and back up before `project.deletePcb`. After copying, check identity and ownership. If save/reopen shows differences in objects, geometry, or nets, stop and investigate; do not edit Unique IDs or copy again automatically.

Before project writes, verify target type, active project, and Board slot. A timeout does not mean an issued call was cancelled. After copy, delete, or move, read the project tree back to confirm identity, ownership, and location. On an unknown outcome, inspect the current state before any retry.
