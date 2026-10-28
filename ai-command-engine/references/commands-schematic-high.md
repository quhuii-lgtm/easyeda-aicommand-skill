# High-Frequency Schematic Commands

This task index does not report call counts. Verify the target window and page using [connection and setup](setup.md), then check parameters with `GET /help?cmd=<command>`. For planning and write requirements, see [schematic operating requirements](原理图操作要求.md) and [schematic commands](commands-schematic.md).

| Task | Commands | Purpose and limits |
| --- | --- | --- |
| Inspect current page | `schematic.getPageInfo`, `schematic.listComponents`, `schematic.listPins`, `schematic.listNets` | Confirm target page, components, pins, and nets. |
| Functional areas | `schematic.placeRegion`, `schematic.listRects`, `schematic.modifyRect` | Draw a box with a title for every new area, then read back its bounds. Adjust to the contents; do not omit boxes or count a written plan as a drawn area. |
| Place components | `schematic.placeDevice` | Check footprint resources and pin mapping after placement; successful placement does not mean it is ready for PCB transfer. |
| Wire | `schematic.labelWire`, `schematic.linkWire`, `schematic.batchWire`, `schematic.drawWire` | Connect a pin to a named net, connect two pins, batch connections, or draw a specified path. `linkWire` requires exactly two pins. |
| Net labels | `schematic.placeNetLabel` | Place a net label. Do not add a duplicate label over a segment already named by `drawWire`. |
| Modify | `schematic.moveComponent`, `schematic.modifyComponent`, `schematic.setAttribute` | Move components or modify components and attributes. |
| Check and save | `schematic.listWires`, `schematic.runDrc`, `schematic.getNetlist`, `schematic.save`, `schematic.exportPng` | Inspect wires, rules, and netlist; save and view the page. A clean DRC alone does not prove correct connectivity. |

Before the first schematic write, read [Schematic Requirements](原理图操作要求.md) and [Schematic Workflow](commands-schematic.md) in full. Follow the required order and the shared [Schematic Completion Checks](原理图操作要求.md#schematic-completion-checks); the command index is not a substitute for either guide.

For `batchWire` label items, `stubLen` sets the stub length (default 60, minimum 20); older versions may ignore it, so check current help. `batchWire` returns per-item results and a netlist audit but does not repair failures. If a write or readback is uncertain, inspect the active page and netlist before proceeding; do not replay the request automatically.
