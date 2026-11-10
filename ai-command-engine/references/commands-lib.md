# Library Commands

Order: find the part and source library → verify symbol, footprint, and model → create, copy, or edit as needed → read back by UUID. For selection alone, stop after inspection.

`lib.*` searches and manages symbols, footprints, and devices. For ordinary placement, prefer `library.searchDevice`, `library.getDeviceByLcsc`, or `schematic.placeDevice`. Check parameters and return values in `/help?cmd=<command>` for the active window. Include the verified `instanceId` in each EDA request.

## Search and inspect

- `library.searchDevice` Search by keyword. Use `library.getDeviceByLcsc` for an LCSC part number.
- `lib.symbolSearch`, `lib.footprintSearch`, and `lib.deviceSearch` find library resources. Verify the matched library.
- `lib.deviceGetByLcscIds` looks up LCSC part numbers. Search scope can differ from placement. Verify library and device IDs when restricting the source. Unavailable in private deployments.
- `lib.symbolGet`, `lib.footprintGet`, and `lib.deviceGet` read resources by UUID. Use `lib.footprintGetSource` for source and verify the source identity and library.

## Create and copy

- `lib.symbolCreate` and `lib.footprintCreate` create blank resources. Confirm fields in current help, then write edited source with `symbolUpdateSource` or `footprintUpdateSource`. Preserve original source and verify the target resource and library before writing.
- `lib.deviceCreate` creates a device. Check the referenced libraries, then read back the symbol, footprint, and model links by returned UUID. Inspect the library if creation is uncertain.
- `lib.symbolCopy`, `lib.footprintCopy`, and `lib.deviceCopy` copy resources. Verify the source and destination library, then read back the new resource.

## Modify and delete

- `lib.symbolModify`, `lib.footprintModify`, and `lib.deviceModify` modify resources. Confirm the target library and submit only the intended changes.
- SDK modification can change a UUID. The response `uuid` is the confirmed readback UUID when available; `uuidChanged` reports a change. `verify` is `get`, `search`, or `none`; `none` means the change was not confirmed by readback. For `partial` or `retryable:false`, inspect current state and do not retry automatically.
- `lib.symbolDelete`, `lib.footprintDelete`, and `lib.deviceDelete` delete by resource UUID. Verify UUID and library first, then search again or inspect source. If the outcome is unknown, stop dependent writes.

## Open in editor

- `lib.symbolOpenInEditor` and `lib.footprintOpenInEditor` open resources. Confirm a valid tab before reading the document.
- After opening, use `project.getDocumentSource` on the active document and verify its UUID before editing or saving.

Library edits do not update schematic or PCB instances automatically. After changing a footprint, recheck the device link, instance pins, and pad numbering. A footprint resource existing does not prove it was transferred to a PCB.

The command families include `lib.symbolCreate`, `lib.symbolUpdateSource`, `lib.symbolCopy`, `lib.symbolModify`, `lib.symbolDelete`, `lib.symbolOpenInEditor`, `lib.footprintOpenInEditor`, `lib.footprintCreate`, `lib.footprintGetSource`, `lib.footprintUpdateSource`, `lib.footprintCopy`, `lib.footprintModify`, `lib.footprintDelete`, `lib.deviceCreate`, `lib.deviceCopy`, `lib.deviceModify`, and `lib.deviceDelete`.
