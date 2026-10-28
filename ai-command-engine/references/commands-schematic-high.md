# Schematic high-frequency commands

“High-frequency” means recommended for common drawing workflows, not a count of actual invocations. Verify the target window using [Connection and setup](setup.md). `GET /help?cmd=<command-name>` uses the proxy's currently selected window; confirm it matches the target version before using its parameters. See [Schematic workflow](commands-schematic.md) for full limitations and [low-frequency commands](commands-schematic-low.md) for specialized operations.

| Stage | Recommended commands | Purpose |
| --- | --- | --- |
| Inspect current state | `schematic.getPageInfo`, `schematic.listComponents`, `schematic.listPins` | Verify the page, components, and pins. |
| Place a component | `schematic.placeDevice` | Plan the layout using [Schematic operating requirements](原理图操作要求.md), then place the component and verify its resources. |
| Connect | `schematic.labelWire`, `schematic.linkWire`, `schematic.batchWire` | Connect a pin to a named net, connect two pins, or make batch connections. Plan short-stub spacing and label direction using [Schematic operating requirements](原理图操作要求.md). |
| Draw precisely | `schematic.drawWire`, `schematic.placeNetLabel` | Specify wire geometry or label position. |
| Modify | `schematic.moveComponent`, `schematic.modifyComponent`, `schematic.setAttribute` | Change position, component, or attribute. |
| Check | `schematic.listNets`, `schematic.listWires`, `schematic.runDrc`, `schematic.getNetlist` | Verify nets, wires, rules, and connectivity. |
| Save and inspect visually | `schematic.save`, `schematic.exportPng` | Save and inspect the actual drawing. |

This page lists 18 commands. After naming a wire with `drawWire`, do not add a same-name label to the same segment. After batch writes, check the returned results and actual netlist. Zero DRC errors alone does not prove the connections are correct.

The host may merge existing wires where `drawWire` connects to them. `primitiveIds` contains IDs that survive in the final result; use `created` for the number created. Since v0.20.21, before writing, compare the associated LINE after native Y-axis conversion with the SDK wire in both directions; stop before writing if they disagree. If a write is partial or readback is uncertain, stop further wire drawing and inspect the original page; do not automatically retry the original request.

## v0.20.106 schematic feedback fixes (partially host-tested; reported defect retained)

Treat failures after an attribute change starts as partial; check the actual value and original call before proceeding. For wire drawing, distinguish valid host display or label reconstruction from real electrical or geometry changes. Do not automatically retry PNG or netlist hangs; see [Schematic workflow](commands-schematic.md). The tested v0.20.106 attribute, wire, and save/reopen cases passed limited acceptance. The display-report defect was corrected in v0.20.107.

## v0.20.107 display net changes and unconfirmed netlist results (limited host acceptance passed)

Display changes report only net ATTR changes that exist before the first write and at the end with the same ID and parent wire. A failed netlist call is partial, so dependent macro steps stop; do not resend a hung request. The tested display report and save/reopen passed in v0.20.107. Failure classification was simulation-only; see [Schematic workflow](commands-schematic.md).

## v0.20.108 JLCEDA string netlist path (limited host acceptance passed)

`getNetlist(JLCEDA)` selects the official file-generation path at call start and reads the returned string; other formats retain the original SDK path. It is called once and shares the existing 45-second wait. There is no fallback or retry after failure. The JLCEDA string call and save/reopen passed limited acceptance in v0.20.108; see [Schematic workflow](commands-schematic.md).

## v0.20.53 batchWire label short stubs (candidate)

`schematic.batchWire` passes through `stubLen` on each label item: the default is 60 and the minimum is 20 schematic coordinate units. Reject an invalid length before writing any item in the batch. Verify each new stub's complete source LINE and SDK target-net readback before starting the next item. If it remains unconfirmed, return non-retryable `partial` and stop the batch, even when `continueOnError` is set. Collision avoidance may change stub direction; different-net crossings, overlaps, or shared endpoints are not safe candidates. Older versions may ignore per-item `stubLen`; use the target window's help. Keep label rotation at 0; do not use 180 degrees to left-align text. After placement, check `placementVerified` separately from footprint and mapping status; successful placement alone does not prove PCB readiness.
