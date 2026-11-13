# PCB 2 · Group and Place Components

Use `__help` in the target window for parameters, defaults, results, and examples.

## Component Placement

### Placement Order

1. Place fixed connectors and mechanically constrained components first.
2. Set the adjacency of power, control, sensing, and external-interface areas.
3. Place critical local circuits such as bypass, driver, bootstrap, feedback, and clock components.
4. Reserve space for major current paths, critical signals, layer-change vias, and return paths.
5. Adjust MCU location and orientation based on all used interfaces.
6. Check one repeated channel before laying out the rest.
7. Check restricted pin exits and shared routing corridors.
8. Adjust spacing, orientation, and alignment of ordinary parts last.

### Functional Areas and Supporting Components

- Check critical IC placement against manufacturer layout requirements for the specific part, footprint, and operating conditions. Distinguish mandatory requirements, recommendations, and choices adopted by this project.
- Apply requirements to specific pads, traces, and return paths. Do not copy example-board coordinates, fixed distances, grid, or rotation angles.
- Group by actual connectivity, not only designator prefix or component type. Identify which pin, interface, or loop each supporting part serves.
- Place supporting parts relative to actual pins and return paths, not in a row around the IC center. Place frequently interconnected areas next to each other with a defined routing corridor.
- When moving or rotating an MCU, check every used interface, supporting component, and neighboring area. Flyline crossings, center distance, and total flyline length are candidate-selection aids only.

Specific part requirements are maintained in `component-pcb-profiles`. Check the manufacturer's source for any unverified part requirements.

| Circuit | Placement checks |
| --- | --- |
| Decoupling and power | Check the actual path among supply pin, pad, via, and return; distance to the capacitor alone is insufficient. |
| Power conversion | Arrange input, conversion, and output paths; check high-frequency loops, bootstrap, feedback, and thermal space. |
| Driver and power switch | Check driver and switching loops; keep power paths from interfering with gate and sensing paths. |
| Crystal and clock | Place crystal and load parts around clock pins; follow the specific guide for guard ground and routing below. |
| Communication interface | Place protection, termination, and branches according to their function and interface topology. |
| Protection and freewheeling | Check the relationship among protection point, fault source, return, and protected path. |
| Analog and sensing | Keep inputs, references, and filters away from interference; match sensor position and axis to the measurement goal. |
| Shunt and precision feedback | Place parts at actual sense points; account for power drop and heat sources. |

Use `pcb.modifyComponentAttribute` for designator position, angle, font, or visibility while preserving its text. Use `pcb.placeHole` and `pcb.placePad` for mounting holes and standalone pads respectively. Check hole type, plating, copper, and solder mask against current help, then read back geometry and nets. Do not substitute a standard via for an NPTH mounting hole.

### Thermal, Assembly, and Alignment

- Check operating temperature and allowed drift for parts near heat sources. Reserve space for thermal copper, vias, heatsinks, and actual airflow.
- Do not split a compact power or driver loop just to spread heat.
- Check large parts against their real bodies and assembly clearance, not just pad bounding boxes. For double-sided and multilayer boards, check all affected layers, through-hole leads, and mating structures.
- Check copper connections and heating differences at both ends of small parts for the actual soldering process.
- If electrical and mechanical conditions allow, align similar parts and spacing. Do not lengthen critical loops for neatness or flag arbitrary angles and spacing alone.
- Make polarity and pin-1 marks visible for assembly and inspection.
- When mechanical, safety, electrical, and manufacturing requirements conflict, revise the design; a fixed ranking does not waive a requirement.

### Repeated Channels and Copies

- Define the template's input, output, control, supporting parts, and returns.
- Check pin number, polarity, net, orientation, and local obstacles in every instance. Check shared power and returns separately.
- Allow different placement for a channel when obstacles or operating conditions differ.
- After reusing via layouts, check each channel's nets, obstacles, current capacity, and thermal conditions.
- A passing template does not replace checks of all instances.

## Programming and Test Access

- Reserve space for programming fixtures, probes, and rework tools during placement. Check access to pads at the actual assembly/test stage.
- Keep connectors, heatsinks, shields, and enclosures from blocking probe access. Size and space pads for the actual probe or fixture and contact surface.
- Open the solder mask over probe pads and inspect the exported result. Bare probe pads usually do not need a paste opening; set soldered-wire or other processes for their actual purpose.
- Mark necessary pin order, signal, and direction without covering the contact area. Match programming-pad order and orientation to the fixture and prevent reversed connection.
- Provide a suitable reference-ground contact near measurement points. It must belong to the circuit under test; do not bridge isolated domains.
- Assess loading from test pads and stubs on high-speed, RF, crystal, and sensitive analog nodes. Probe loading can alter the signal, so consider the measurement method too.
- Put 0-ohm resistors where they are accessible and leave room to measure both ends. Ensure a connection meant to be opened cannot be bypassed by copper or another branch. Size the resistor and its traces on power paths for actual current.
- Verify the actual pad nets for all programming pads and test points.

## Check grouping and movement

- After `pcb.moveComponent`, verify position, angle, side, and lock state. `pcb.checkPlacement` uses readable pad boundaries; skipped or unsupported objects do not count as a pass.
- When schematic import/update has been read back and sources are verifiable, offer functional-region marking and component-moving groups as separate optional choices. Reuse explicit choices; do not execute either without authorization. See [optional tool offer rules](pcb-01-read-board-and-rules.md#pcb-optional-tools).

## Mark and locate schematic functional regions

These commands use functional frames in the schematic associated with the current PCB. They mark regions or locate/highlight them without moving components.

1. Open the target PCB and call `pcb.getSchematicRegions` to read region members and unmatched objects. Include locked members in the review.
2. Call `pcb.markSchematicRegions` with the default `dryRun:true` to preview the marks. Check the regions and members before deciding.
3. Only after explicit authorization, call `pcb.markSchematicRegions` with `dryRun:false`. Read back the result, then save, close, reopen, and verify the marks.
4. Use `pcb.locateSchematicRegion(regionId)` to locate/highlight a region. This command does not write design data.

The menu entries are **Mark Functional Regions (No Component Movement)…** and **Locate/Highlight Functional Region…**. They are separate from `pcb.groupBySchematicRegions`, which moves components; do not call that command by default. Check `__help` for complete parameters and results.

## Component-moving groups

`pcb.groupBySchematicRegions` moves components and creates groups. Use it only when the user explicitly selects component-moving groups, after reviewing the preview, fit, and impact; it is not the functional-region marking workflow above. If recovery after a grouping write cannot be verified, the error carries `cause.partial:true` and a backup ID. Inspect the original PCB before continuing. Macros stop dependent writes even when configured to continue after ordinary errors.

If the PCB changes or a preview becomes stale, check the active board and preview again. When an operation's outcome is unknown, inspect the actual state before continuing.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Schematic region marks and highlighting | `pcb.getSchematicRegions`, `pcb.markSchematicRegions`, `pcb.locateSchematicRegion` | Read region members, preview marks (`dryRun:true` by default), explicitly execute marks (`dryRun:false`), or locate/highlight without writing design data. |
| Placement and outline | `pcb.moveComponent`, `pcb.checkPlacement`, `pcb.drawOutline` | Move components, check spacing, and create the board outline. |
| Component-moving groups and recovery | `pcb.groupBySchematicRegions`, `pcb.sourceRollback` | Move components to create groups only when explicitly selected. Verify the target and backup before recovery. |
