# Schematic 3 · Wire and Check Each Area

Verify the window, project, and page using [Connection and Environment](setup.md). Use `__help` in the target window for parameters, defaults, and results.

## Direct Wires and Labels

- `schematic.linkWire` defaults to an outward U-shaped route only for upward-facing or horizontal aligned pins when `jogDir` is omitted. An explicit direction is honored. This does not avoid arbitrary symbol-body collisions; inspect the drawing after routing.
- Within a functional area, prefer direct wires between nearby pins on the same net, including GND. Use labels or ports as needed between areas, pages, or for long connections.
- Use a connection method recognized by the software. Make unconnected crossings clear, and do not run different nets collinearly over one another.
- Keep a direct route within 40 grid cells by default. If the current interface cannot read the grid step, mark it unknown; do not claim to have read it or treat 50 mil as a measured or fixed step. When the grid is unknown, estimate conservatively, read endpoints back after drawing, and check snapping in the EDA interface.
- Count the entire polyline route, not each segment separately. For branches, find the shortest route between every endpoint pair and use the longest of those routes. Endpoints include pins, label-stub ends, and branch ends. Do not sum all branches as one path.
- Rework routes longer than 40 cells or use a same-name net label where a local physical connection is unnecessary. Record approved exceptions for required direct routes. Keep routes clear of other nets, symbols, and text.
- Place labels at clear wire-stub endpoints, not directly on pins. Usually keep `rotation: 0`; `rotation: 180` flips the text and is not a way to left-align it. Leave enough text width for left-facing stubs and check readability from the label anchor and actual display.
- After placement, verify the attached wire and net name. Usually keep one label per group after directly joining nearby GND pins. Remove unnecessary dangling stubs.

## Leads and Spacing

- Follow the actual symbol orientation: lead outward from the real pin endpoint before turning. If the destination is on the other side of the symbol, route around the symbol body.
- Do not route backward through the symbol body, another pin, or an NC mark. Do not require a specific pin number to exit left or right.
- Plan component spacing and bus location before drawing. Avoid useless large gaps between interfaces, capacitors, and branches.
- Keep components and text inside their functional area when boxes are used. Do not sacrifice text clearance or readability just to shorten wires. Necessary bends for clearance are acceptable.

## Labels and NC

- In Professional Edition, a net label sets the wire's name property.
- Check the current drag setting before moving a label. After moving it, check whether the original wire name changed.
- NC means the pin is confirmed to be allowed to float. A function pin that is unused must still follow its datasheet; do not use NC to hide an unexplained floating pin.
- In Professional Edition, NC is a pin property and its mark belongs at the pin endpoint. Clear that property before connecting an NC pin.

## Programming Pads, Test Points, and 0-Ohm Links

- Draw the signals, reference ground, and target voltage needed for the selected programming method. Include required reset and boot configuration connections, and check the programming path for each programmable device.
- Check whether other components use or interfere with programming pins and whether the programmer and board supply could back-feed each other.
- Give test pads clear designators, nets, and footprints. Identify their purpose and, when useful, normal voltage or signal range.
- Specify the reference ground for testing; do not join grounds across isolated domains.
- Draw 0-ohm resistors as real parts and identify both nets and their purpose. If the link must be opened for measurement, check for alternate paths between its ends.
- State the default assembly state and restoration requirements for each 0-ohm resistor.
- Bare test pads transfer to PCB but should not become purchased or assembled parts. Include 0-ohm resistors and installed test terminals in the BOM as required by assembly.

## Conditions for wiring commands

`schematic.linkWire` does not assign a net name. For a direct wire that needs an explicit name, use `drawWire` with a net name as supported by current help, or set the name on an existing wire and read it back. Electrical continuity alone does not prove the intended net name.

- `schematic.labelWire` connects an actual pin to a named net. Inspect an existing connection before joining a differently named net. Verify label attachment and stop dependent writes if the result is unknown.

- `schematic.linkWire` directly connects two actual pins. Auto-planned paths can cross symbols, so check the drawing, netlist, and DRC.

- `schematic.batchWire` batches connections. Inspect individual results and the netlist audit. Stop dependent steps after a write with an unknown outcome.

- `schematic.drawWire` takes `points` and may set net name, color, width, line style, and label location; use current help for exact fields. After drawing, check all segments, net, and non-target objects. Host merges, property changes, or delayed readback can result in `partial`; inspect current state instead of retrying. Crossings, overlaps, or touching endpoints between different nets are not safe connections. Do not wire NC pins. Source Y coordinates are opposite the public API direction and cannot be passed directly.

- Internal T-junction adaptation applies only to supported line styles and connection directions. Check the original line split, requested branch, net, style, and non-target objects. Do not generalize it to reverse entry or merging multiple wires; an audit alone does not prove the drawing is unobstructed.

- For `schematic.placeNetLabel`, the anchor must lie on a wire; nearby text is not a connection. `listWires.line` is a flattened host encoding; every four values may describe one segment of a multi-segment wire. Confirm against valid source `LINE` data instead of treating it as one continuous polyline. After component rotation or mirroring, read actual pin endpoints again with `listPins`.

- Before `schematic.modifyWire`, verify target wire and source. Preserve unrequested color, width, style, and NET state. Distinguish no NET property, empty NET, and non-empty NET. Pass `net:''` only to explicitly change an existing empty NET; do not add a net name to a wire that had no NET property. Use current help and readback for line-style values. After each wire and batch, check object, NET, LINE ID, endpoints, and style. Stop dependent writes if failure or recovery is unconfirmed.

- Use `schematic.modifyNetLabel`, `setWireNet`, `repairNet`, `dedupeWireNets`, and similar commands according to current help. Check label attachment, wire net, and original style after changes. A non-zero duplicate-property count means duplicates remain. `dedupeWireNets` rejects unsupported geometry or mixed styles; do not continue after a segment is dropped.

### Recover from Wiring Anomalies

| Symptom | Read first | When to continue |
| --- | --- | --- |
| `drawWire` reports `partial` or times out | Check task state, native `LINE` endpoints, affected attributes, and non-target objects. | Add only confirmed missing segments once the outcome is known. Keep landed segments. Stop writes if the cause or attribute changes remain unexplained. |
| `labelWire` fails or the label result is missing | Check wires, label IDs, parent wires, and actual attachment. | Keep a confirmed wire and attached label. After confirming there is no residue, use an explicit short segment and label if needed. |
| The structural audit reports same-net overlaps or a cross-net bridge | Check each native `LINE` segment, then compare the netlist and close-up. | Retain the raw finding. Record a false positive only if native geometry and connectivity support that conclusion. |

If readback shows a transient anonymous net, allow the host topology to refresh and read the netlist again. If it still differs, retain both captures and investigate the difference.

## Check each area before completion

Recheck the targets recorded during placement. Use actual component anchors for row and column alignment, then inspect pin and segment readback for straight connections, path lengths, and area dimensions. Check layout length targets and the 40-grid rule separately. Obtain missing coordinates or paths and inspect the latest close-up for text clearance. After rework, rerun the same area checks and recheck pin nets and NC.

Run [check-schematic.mjs](../scripts/check-schematic.mjs) with Node.js and pass the design JSON and plugin readback JSON for the same area. Use `alignments` for alignment groups, `maxWidth` or `maxHeight` for area bounds, and `requireStraight` and `maxLength` for two-pin connections. Supply each actual component's `anchor: [x, y]`. Record the applicable targets and why any do not apply.

- For each specified two-pin group, the script reports length and bends on one shortest physical route. Consecutive segments in the same direction count as one run.
- Set length, straightness, and optional `maxBends` targets before wiring. Check any route with three or more bends for avoidable detours. Use pin orientation, clearance and the close-up to judge the route.
- The default is 40 grid cells. A higher page-wide `maxDirectGrids` fails and the script still checks at 40. A lower page-wide limit is allowed.
- Approve any relaxation before using it. Record the design reason and the user's approval or the expert review that passed it. Pass the separate approval JSON as the third script argument. It contains `page` and `exceptions`. Each exception requires exact two-pin `endpoints`, `maxGrids`, `reason`, `approvedBy`, and `approvalRef`. The script checks the record fields. Verify the approval against its source.
- For a redraw, supply the original frame as `regions[].baselineBounds` to report the change in area.
- To screen gaps, supply `regions[].blockGaps` entries with `blocks` (two names), `axis` (`x` or `y`), and `maxGap` in source units. Supply the actual bounding boxes by name in the readback region's `blockBounds`.
- After wiring, inspect gaps between blocks and around the frame on the close-up. Keep room for labels, titles, and wire exits when tightening the layout.

`structuralAudit` can screen for cross-net bridges, overlapping boxes, out-of-area objects, and collision candidates. It cannot confirm that no functional area was omitted or that all visual issues are acceptable. Zero DRC findings or a passing audit does not replace pin-by-pin netlist comparison and drawing inspection. List unavailable checks as incomplete instead of skipping them and reporting full completion.

### Runnable example and result codes

The skill includes a synthetic A4 example with a straight local connection and a shared net on two pages. See [design.json](../examples/schematic-audit/design.json) and [readback.json](../examples/schematic-audit/readback.json). Run from the skill directory:

```sh
node scripts/check-schematic.mjs examples/schematic-audit/design.json examples/schematic-audit/readback.json
```

This runs the whole-sheet check. To try preflight and block checks, copy the design JSON and set `stage` to `planning` or `wiring`. The example has one block, so the same readback can be reused for all three stages.
In a real drawing, derive the expected JSON from the approved circuit or connection table. Build the actual JSON from a fresh plugin readback of the same scope. Use native `LINE` endpoints for `nodes`, `segments`, and `wirePaths`. Normalize source Y to the API direction. Use the host netlist for pin membership and explicit pin attributes or source markers for NC.

| Exit | Meaning and action |
| --- | --- |
| 0 | Supplied checks passed. |
| 1 | A check failed. Fix the issue and rerun the affected scope. |
| 2 | Input or execution error. Read stderr and correct the input or invocation. |
| 3 | A candidate or incomplete check remains. Obtain missing readback and resolve candidates. Record manual evidence against the relevant check. |

The example returns 0 for `planning` and 3 for `wiring` and `sheet`. The script reserves drawing review for the operator. At sheet level it also reserves DRC, structural and persistence review. A report with zero failures can still be incomplete.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Wire | `schematic.labelWire`, `schematic.linkWire`, `schematic.batchWire`, `schematic.drawWire` | Connect a pin to a named net, connect two pins, batch connections, or draw a specified path. `linkWire` requires exactly two pins. |
| Net labels | `schematic.placeNetLabel` | Place a net label. Do not add a duplicate label over a segment already named by `drawWire`. |
| Repair nets and labels | `schematic.setWireNet`, `schematic.modifyWire`, `schematic.dedupeWireNets`, `schematic.repairNet`, `schematic.listNetLabels`, `schematic.pruneFloatingLabels`, `schematic.fixNetLabels`, `schematic.modifyNetLabel`, `schematic.moveLabel` | Inspect or repair wire nets and labels. Read target objects first; if a write is uncertain, stop and check the drawing and netlist. |
| Pins and no-connect | `schematic.connectPin`, `schematic.setPinNoConnect` | Connect an actual pin or mark no-connect. |
