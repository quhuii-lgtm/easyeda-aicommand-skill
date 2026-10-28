# Library Commands

`lib.*` searches and manages symbols, footprints, and devices. For ordinary placement, prefer `library.searchDevice`, `library.getDeviceByLcsc`, or `schematic.placeDevice`. Check parameters and return values in `/help?cmd=<command>` for the active window. Include the verified `instanceId` in each EDA request.

## Search and inspect

- `library.searchDevice` searches by `keyword` (`limit` defaults to 10). `library.getDeviceByLcsc` looks up one `lcscId` and errors if none is found. Results include library identity and component information; a search result is not an instantiated project component.
- `lib.symbolSearch`, `lib.footprintSearch`, and `lib.deviceSearch` search by `key`, with optional `libraryUuid`, `classification`, `page`, and `itemsOfPage`. Page values are positive integers; defaults are 1 and 20. An empty key lists the selected library. If no library is specified, search defaults to the personal library.
- `lib.deviceGetByLcscIds` accepts one or more `lcscIds`; `allowMultiMatch` defaults to `false`, and `diagnostic` defaults to `false`. Set `allowMultiMatch:true` to retain multiple matches for the same LCSC ID; set `diagnostic:true` to include diagnostics for the single SDK call. This search defaults to the personal library and is unavailable in private deployments. Its default search scope differs from `schematic.placeDevice(lcscId)`. To constrain placement, pass `libraryUuid` and check the requested library, selected library, and device UUID in the response. The plugin does not switch to a different library automatically.
- `lib.symbolGet`, `lib.footprintGet`, and `lib.deviceGet` read full resource properties by UUID; omitted `libraryUuid` defaults to the personal library. `lib.footprintGetSource` searches the project library then personal library when no library is specified; an explicit library disables fallback. Check the source DOCHEAD/HEAD UUID against the requested UUID.

## Create and copy

- `lib.symbolCreate` and `lib.footprintCreate` create blank resources. Confirm fields in current help, then write edited source with `symbolUpdateSource` or `footprintUpdateSource`. Preserve original source and verify the target resource and library before writing.
- `lib.deviceCreate` requires `name` and `symbolUuid`; `symbolType` can create a blank symbol. Footprint, 3D model, classification, description, and properties are optional. The main `libraryUuid` defaults to the personal library. For cross-library resources use `symbolLibraryUuid`, `footprintLibraryUuid`, and `model3DLibraryUuid` (the latter defaults to the device library). A model library requires `model3DUuid`; the plugin checks model identity and library. After creation, read back by returned UUID and check resource links. If `get` is unavailable, search by the exact UUID; do not create again.
- `lib.symbolCopy`, `lib.footprintCopy`, and `lib.deviceCopy` require a source UUID and `targetLibraryUuid`. `targetClassification` defaults to an empty array; `newName` is optional. Check the returned new UUID. A same-name target may be rejected or return empty; inspect the library before deciding what to do.

## Modify and delete

- `lib.symbolModify`, `lib.footprintModify`, and `lib.deviceModify` target a UUID and optionally accept `libraryUuid` (personal library by default). Submit only intended fields; omitted `name` preserves the current name, and optional properties set to `null` are cleared. A device can change linked `symbolUuid`/`footprintUuid` and use `property` to change attributes such as designator, manufacturer, and supplier.
- SDK modification can change a UUID. The response `uuid` is the confirmed readback UUID when available; `uuidChanged` reports a change. `verify` is `get`, `search`, or `none`; `none` means the change was not confirmed by readback. For `partial` or `retryable:false`, inspect current state and do not retry automatically.
- `lib.symbolDelete`, `lib.footprintDelete`, and `lib.deviceDelete` delete by resource UUID. Verify UUID and library first, then search again or inspect source. If the outcome is unknown, stop dependent writes.

## Open in editor

- `lib.symbolOpenInEditor` and `lib.footprintOpenInEditor` open a resource by UUID; `libraryUuid` is optional and defaults to personal library. Check the returned `tabId`. No valid tab ID means opening was not confirmed. An `[object Object]` error is an unreadable host error and does not prove the resource is absent.
- After opening, use `project.getDocumentSource` on the active document and verify its UUID before editing or saving.

Library edits do not update schematic or PCB instances automatically. After changing a footprint, recheck the device link, instance pins, and pad numbering. A footprint resource existing does not prove it was transferred to a PCB.

The command families include `lib.symbolCreate`, `lib.symbolUpdateSource`, `lib.symbolCopy`, `lib.symbolModify`, `lib.symbolDelete`, `lib.symbolOpenInEditor`, `lib.footprintOpenInEditor`, `lib.footprintCreate`, `lib.footprintGetSource`, `lib.footprintUpdateSource`, `lib.footprintCopy`, `lib.footprintModify`, `lib.footprintDelete`, `lib.deviceCreate`, `lib.deviceCopy`, `lib.deviceModify`, and `lib.deviceDelete`.
