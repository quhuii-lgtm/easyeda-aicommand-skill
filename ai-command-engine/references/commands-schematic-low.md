# Task-Specific Schematic Commands

This index groups less common tasks; it does not indicate a command is unusable or unverified. Check parameters in `GET /help?cmd=<command>` for the active window. See [schematic commands](commands-schematic.md) for operations and write limits.

| Task | Commands | Purpose and limits |
| --- | --- | --- |
| Regions and locating | `schematic.listRects`, `schematic.modifyRect`, `schematic.checkRectOverlap`, `schematic.placeRegion`, `schematic.getComponentsInRect`, `schematic.getPrimitivesInRegion`, `schematic.getPrimitiveAtPoint`, `schematic.getSelection` | Inspect or modify regions and locate primitives by region, point, or selection. |
| Build and diagnose | `schematic.buildBlock`, `schematic.getPlacementResourcesDiagnostic`, `schematic.connectPin`, `schematic.setPinNoConnect` | Build a functional block, check placement resources, connect pins, or mark no-connect. |
| Repair nets and labels | `schematic.setWireNet`, `schematic.modifyWire`, `schematic.dedupeWireNets`, `schematic.repairNet`, `schematic.listNetLabels`, `schematic.pruneFloatingLabels`, `schematic.fixNetLabels`, `schematic.modifyNetLabel`, `schematic.moveLabel` | Inspect or repair wire nets and labels. Read target objects first; if a write is uncertain, stop and check the drawing and netlist. |
| Layout and checks | `schematic.autoLayout`, `schematic.structuralAudit`, `schematic.runDrcDetailed` | Preview or adjust layout, inspect structure, and read detailed DRC. |
| Attributes, text, delete | `schematic.getAttributes`, `schematic.delete`, `schematic.placeText`, `schematic.listTexts`, `schematic.modifyText` | Read attributes, place or list text, or delete a specified object. |
| Export | `schematic.exportBom`, `schematic.exportNetlist` | Export a BOM or netlist. |

Before `schematic.modifyWire` changes style, verify the target net and style fields to preserve. For repair commands, confirm the target object and whether `dryRun` is supported. Do not repeat an operation with an unknown outcome.

## EDA version limits

On EDA 4.1.78, `schematic.modifyText`, `schematic.getPrimitivesInRegion`, and `schematic.getPrimitiveAtPoint` are guarded and reject execution with an EDA 4.2 requirement. Native `modifyText` changes on 4.1.78 revert after save and reopen. Do not treat rejection as feature validation; actual execution and persistence on EDA 4.2 still need checking.
