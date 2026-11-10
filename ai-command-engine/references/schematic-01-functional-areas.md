# Schematic 1 · Plan and Draw Functional Areas

Verify the window, project, and page using [Connection and Environment](setup.md). Use `__help` in the target window for parameters, defaults, and results.

The project supplies the confirmed scope, intended connections, and design conditions.

Manage stage acceptance and project records according to the project plan. For offline generation or another backend, apply only relevant drawing and design requirements; do not use them to initiate online writes.

## A4 Page Planning

Read the target sheet size and bounds before drawing. Reserve space for the title block, margins, and any other protected area in the same coordinate units.
List complete functional blocks and estimate the space each needs for symbols, pin exits, labels, and attributes.
Start with one sheet. If it cannot fit, move a complete functional block to another sheet, check both layouts again, and list the affected cross-page nets.
Confirm page scope under the project rules before drawing.

Run the [checker](../scripts/check-schematic.mjs) with `stage: "planning"`. List the current page’s confirmed block IDs in `regions`.
Supply `layoutPlan` with `currentPageId`, `pages: [{ id, paper: "A4", bounds, reserved }]`, and `blocks: [{ id, pageId, bounds }]`.
Assign each complete block one ID. Separately approved subfunctions may have their own IDs.
Use `[x1, y1, x2, y2]` for bounds and a list of boxes for `reserved`. Set `page`, `pageId`, and the host’s actual `pageFrame: { paper, bounds }` in the readback JSON.
Keep the plan for subsequent stages so the checker can compare the actual block boxes with their planned space.

## Required Drawing Order

Use these steps for new drawings and the scope of the current edit. Reuse correct existing content; do not ask the user to confirm each step.

1. Read the target page and current state. List the functional areas, their components, pin nets, and allowed NC pins in scope.
2. For each new area, draw a box with a title before placing components. A name in a plan or components alone do not count as a drawn area. Reuse an existing box and title when they meet the requirements.
3. After placement, read back actual designators, pin endpoints, and orientations. Arrange components, branches, and text before wiring.
4. In each area, use nearby direct wires, bus wires, or labels as appropriate. If a command or macro default does not meet the requirements, use a suitable connection command.
5. After each area, check its box, title, component membership, wires, and label attachments; inspect an enlarged current image. Correct missing boxes, wires through symbols, obscured text, or extra labels within the authorized scope before continuing.
6. Finally compare the netlist with the connection table, run ERC/DRC, inspect the whole page, and save. If visual or connectivity checks are missing, report only the completed portion.

## Plan Functional Areas and Pin Connections

- For a multi-area drawing, plan each area's position, reading order, and title space.
- Size area borders for actual symbols, pin leads, labels, and property text. Allow extra room for large modules and high-pin-count parts.
- Set component spacing from symbol dimensions; do not reuse fixed coordinates from another project.
- Before batch placement, prepare part numbers, intended designators, and a pin-to-net table. Reuse part research already obtained and prefer batch lookup when supported.
- Identify pins by component and pin number; distinguish units in multi-unit components.
- Check the `refMap` returned by `buildBlock`, then compare actual designators and pin wiring.
- List power, ground, signals, and valid NC pins separately. Confirm the purpose of unassigned pins.
- Prefer direct connections between nearby pins on the same net. When a label is needed, lead a short wire outward from the actual pin connection point.
- Set label spacing for the current units, text, and neighboring pins. Do not apply an upstream 10-unit offset as a fixed rule.
- After generation, check that components, labels, and text stay inside their functional areas; adjust the layout or enlarge an area if needed.

These requirements guide planning and readback; they do not mean `buildBlock` automatically avoids symbols based on their dimensions. Adjust existing drawings only within the authorized scope; do not rearrange the whole drawing just to add functional boxes.

Reference: [Official schematic placement and pin-routing skill](https://github.com/easyeda/easyeda-enhanced-schematic-skill/blob/main/SKILL.md), checked 2026-10-10. Only its layout and batch-preparation methods are used here.

Continue to use this plugin's commands and the existing save and acceptance workflow.

## Drawing Rules

Use these rules for new drawings and later cleanup. Direct-wire length and placement follow the user's stated defaults unless the project specifies otherwise. Distances on a schematic are not PCB electrical distances.

## Functional Areas and Net Names

- Arrange functional areas in reading order. Preserve the same functional relationships in repeated channels and check each one.
- Give each electrical net one clear name. Do not put different names or labels on the same wire.
- If different names are directly connected, verify the intended connection first. Use one name if they are the same net; if names must remain distinct, specify exactly where and how they connect.
- Do not use flexible multi-name net joining as the normal drawing method.
- For sheets and hierarchical sheets, check the correspondence between ports and nets. Local, port, and global names may differ only when their mapping is correct.

## Reusing Modules

- Record source revision, operating conditions, and completed checks. Mark incomplete modules and undecided interfaces; do not treat them as production-ready.
- Check logic levels, direction, power domains, and unpowered states; also check pin order, polarity, footprint, surrounding components, and current return.
- For hierarchical modules, check the ports connecting them to the main sheet.
- Validate one unit first, then check each designator and channel net. Recheck pins and geometry for rotated or mirrored instances.
- A successful schematic reuse check does not mean the PCB can be copied directly. Recheck affected instances after changing the source module.

## Functional areas first

For a new area, use `schematic.placeRegion` to draw its box and title, or reuse a box already created by `buildBlock`; do not draw a duplicate. Use `listRects` to check its `span`, and verify the title and actual image. Returning a box ID alone does not confirm the title was created.

`placeRegion` uses `x,y` for the upper-left corner and top edge of the box. `buildBlock.region` uses `x,y` for the lower-left corner. Both calculate with +Y upward, so do not reuse the same Y value without conversion. Adjust dimensions for actual components, pin leads, and text.

`buildBlock` is an initial placement and wiring macro; it does not guarantee the required layout or direct connections. Default power and multi-pin nets use a label on each pin. Explicit `style:"wire"` also connects directly only when the input resolves to exactly two pins. To directly connect nearby pins within an area, use `nets:[]` to create only the box and initial component placement, read back `refMap` and actual pins, arrange components, then wire one area at a time. An unwired area is not complete.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Inspect current page | `schematic.getPageInfo`, `schematic.listComponents`, `schematic.listPins`, `schematic.listNets` | Confirm target page, components, pins, and nets. |
| Functional areas | `schematic.placeRegion`, `schematic.listRects`, `schematic.modifyRect` | Draw a box with a title for every new area, then read back its bounds. Adjust to the contents; do not omit boxes or count a written plan as a drawn area. |
| Regions and locating | `schematic.listRects`, `schematic.modifyRect`, `schematic.checkRectOverlap`, `schematic.placeRegion`, `schematic.getComponentsInRect`, `schematic.getPrimitivesInRegion`, `schematic.getPrimitiveAtPoint`, `schematic.getSelection` | Inspect or modify regions and locate primitives by region, point, or selection. |
| Titles and location | `schematic.placeText`, `schematic.listTexts`, `schematic.modifyText` | Place, inspect, or edit titles. |

After verifying the boxes and titles, proceed to [component placement and layout](schematic-02-component-layout.md).

## Host support for primitive lookup and title editing

On EDA 4.1.78, `schematic.modifyText`, `schematic.getPrimitivesInRegion`, and `schematic.getPrimitiveAtPoint` are guarded and reject execution with an EDA 4.2 requirement. Native `modifyText` changes on 4.1.78 revert after save and reopen. Do not treat rejection as feature validation; actual execution and persistence on EDA 4.2 still need checking.
