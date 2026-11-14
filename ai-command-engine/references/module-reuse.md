# Reuse a Module

Use this guide when extracting a reusable design, restoring a saved module, composing its PCB, or replacing components. Open the extension's **Module Reuse** menu for the visual workflow, or send `module.*` commands through the proxy. Read `__help` on the target EDA window before using a command; its parameters, defaults, and result fields are authoritative.

## Workflow

1. Confirm the source project, selected objects, target project, and intended reuse scope. Use `module.captureExtractionSource` before extracting a design.
2. Extract with `module.extractModuleArchive`, using `workcard.newModule.localId`, `workcard.newModule.version`, and the requested name. A successful extraction is saved to the module library automatically. The optional `libraryDirectory` selects a directory for this extraction only. If saving fails, preserve the extraction result and retry only with `module.librarySave`; do not repeat the design operation.
3. Find the saved module with `module.libraryList` or `module.librarySearch`, inspect it with `module.libraryGet`, and merge-import its archive with `module.restoreFile`. This verifies import metadata only (`contentVerified:false`); it is not an exact whole-project replacement.
4. For a schematic, place the page with `module.placeSchematicPage`, align the PCB template with `module.alignTemplatePcb` when needed, and map nets with `module.mapInstanceNets`. Read back the resulting instances and netlist. If a repeated business command returns an unknown, partial, or pending-verification result, treat it as a failure; use its matching `module.get*Operation` command to inspect the record before continuing.
5. For PCB composition, call `module.preparePcbComposition`, then `module.composePcbInstance`. If the result is uncertain, inspect `module.getPcbCompositionOperation` before taking another action.
6. For component replacement, identify a suitable alternative and verify its footprint and pin mapping. Get user approval before calling `module.prepareReplacement` and `module.executeReplacement`. If the result is uncertain or times out, query `module.getReplacementOperation` before retrying. A timeout stops later replacement writes, but cannot cancel an EDA operation already sent.
   Local routes must make verifiable copper contact with the anchor and target pad on their actual copper layers. The replacement flow does not add transition vias; if contact cannot be proved, stop and report the failure.
7. Verify valid component associations, component identities, and pin-to-net mappings. Confirm associations using both the actual project resources and the final official netlist. Save, close, reopen, and read back each changed document before reporting persistence.

## Module Library Location

- A directory explicitly selected by the user takes priority and is remembered for later library operations.
- If no directory has been selected, the default is `module-library` under the actual JLCEDA installation directory. This is not the EDA documents directory.
- If the installation directory cannot be identified reliably, or the target is not writable, ask the user to choose a writable absolute directory. Do not silently switch locations or request elevated permissions.
- `module.setLibraryDirectory` changes where later library operations look. It does not move existing files or overwrite an older version. The original module files remain intact; the user can point back to their existing library directory.
- Changing the directory does not migrate saved operation state from the standalone module-reuse extension. Finish its in-flight work and stop its bridge before using the merged extension. Do not uninstall the old extension automatically.

## Scope and Limits

The merged extension uses the ACE proxy and `module.*` commands; it does not start or register the standalone module-reuse Gateway/RPC. Merging does not add support for copper fills, cutouts, or custom openings; handle those as separate PCB finishing work where supported.

In this resistor sample, the official **Existing Project** import rebuilt resource UUIDs. Its first export, made before opening or saving the sheet, lacked `META.tags` on `DEVICE`, `SYMBOL`, and `FOOTPRINT`; **New Project** mode retained those tags in the same sample. These resource classification tags differ from module-library search `tags` and do not indicate a change to electrical connections.

Check About for the installed extension version and query `__help` in the target window for supported module commands and parameters. Local source does not prove that a command is available in the installed extension. Module business acceptance is still in progress.
