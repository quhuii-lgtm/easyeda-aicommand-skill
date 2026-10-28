# PCB Operation Requirements

This page covers PCB creation, modification, and result checks. The project defines confirmed scope, intended connections, and design conditions.

Manage stage acceptance and project records according to the project plan. For online work, use the command pages linked from the skill entry and help for the installed version. For offline generation or another backend, apply only relevant board-design requirements; do not use them to initiate online writes.

## Outline and Manufacturing Rules

- Confirm board outline, holes and slots, fixed interfaces, assembly side, and component height first.
- Set connector positions and orientation from the mechanical drawing, mating plug, and assembly method. Check that a fully inserted plug is not blocked by the board edge, enclosure, or nearby parts. Leave room for cable bend, latch, and insertion/removal tools.
- For board-to-board connectors, check the mating board's position, orientation, and height. Allow space around mounting holes for actual screws, washers, and standoffs.
- Check breakaway edges, process rails, and assembly clearance for the actual production method. Lock only components with confirmed position requirements.
- Set trace width, clearance, copper-to-edge, and hole rules for the actual process. Distinguish drill size from finished-hole size, plated from non-plated holes, and tenting, plugging, or filling requirements.
- Check which objects are affected by net, layer, and region rules; do not check only defaults. Verify the basis separately for insulation, creepage, or impedance requirements.

## Stackup and Current Return

- Document each layer's purpose, material, copper thickness, and dielectric thickness.
- Record drawing copper thickness, thickness used for checks, and ordered thickness separately. Record differences and their status. Mark unconfirmed order processes as pending and confirmed but unsubmitted processes as proposed order parameters.
- Changing check parameters does not change the drawing stackup. The correct copper-layer count does not prove the physical stackup is correct.
- Choose stackup based on routing density, power, and fabrication capability. Few signal transitions do not mean every logic transition is slow.
- For critical signals, identify the layer, reference copper, and return path. Check whether holes, slots, and traces break the reference plane. A layer named GND does not prove its copper is continuous.
- Return current spreads over the plane; it does not flow only along one line in a diagram.

For a four-layer board, compare options against the actual design; there is no universal best stackup. S = signal, G = ground, P = power.

| Top to bottom | Main checks |
| --- | --- |
| S / G / P / S | Is the power reference for bottom traces continuous? How does the return path work when changing reference? |
| S+P / G / G / S+P | Is outer-layer power sufficient? How are the two ground layers connected? |
| S / G / P+some S / G | Which plane actually references inner signals? Do traces fragment the power region? |

- Even with the same layer order, check dielectric thickness and impedance. For two-layer boards, check whether the actual copper provides a return path. A six-layer board is not automatically better because it has more layers.
- Do not call impedance passed without a real manufacturing stackup. Keep fast or sensitive signals away from reference-plane gaps. When a signal changes layers, check how return current changes layers too.
- Use ground vias between same-ground reference planes as needed. Never connect reference planes at different potentials with a ground via.
- When a signal changes from ground to power reference, check the AC return conditions or change the routing layer. Do not add capacitors to every layer-changing signal by default.
- Differential signals also carry common-mode current when both conductors move together; check their return path. Do not split a plane merely because nets are named AGND and DGND. Do not damage isolation slots, antenna clearances, or special sensing structures to add a return path.

## Differential Signals

Use `knowledge.query` with `query: "USB"` to find interface guidance, then determine impedance, spacing, length matching, and reference planes from the actual standard, component documentation, fabricator stackup, and project constraints. Knowledge-base values are for initial planning only; do not treat a single interface's example as a fixed rule for all differential pairs.

After routing, check pair rules, spacing along both traces, length difference, reference-plane continuity, and layer-change locations.

### Match Impedance Design to the Order

Either select a fabricable stackup first and then calculate, or calculate from an existing order's actual parameters. Use the same selected parameters for design and order, and compare them item by item.

- Record fabricator, stackup name or code, source and lookup date, layer count, finished board thickness, material, and inner/outer copper thickness.
- From the official calculator, record impedance model, target, signal and reference layers, differential gap or coplanar ground spacing, and calculated trace width. Record dielectric thickness, Dk, solder mask, and other model parameters from an actual source; do not fill them with guessed defaults.
- Distinguish proposed parameters, parameters used in a calculation, and order-confirmed parameters. At ordering, compare construction, material, thickness, copper, impedance test, and tolerance. Recalculate if they differ; checking layer count alone is insufficient.
- The physical stackup in EDA does not prove the order uses the same construction. An impedance estimate is not a manufacturing guarantee. Automatic parameter linking in the current B4 workflow has not been developed.

Sources: [JLC impedance calculator guide](https://jlcpcb.com/help/article/user-guide-to-the-jlcpcb-impedance-calculator), [standard multilayer stackups](https://jlcpcb.com/help/article/multi-layer-pcb-standard-laminated-structures), and [EDA stackup and ordering](https://prodocs.lceda.cn/en/pcb/tools-layer-manager/).

## Checks After Copying a Multilayer Board

- After copying a four-layer or other multilayer board, verify the target board's schematic association.
- Check target copper order, dielectric layers, total thickness, layer purpose, and copper thickness against the current design requirements.
- If the original board must be preserved, confirm it still exists and its contents have not changed.

## Unnetted Pads

- Check each unnetted pad's pin number, purpose, and confirmed connection individually.
- Distinguish missing connections, unused signal pins, functions allowed to float, and mechanical pads.
- Require part-specific documentation before leaving a functional pin floating. Check mechanical pads for any required ground or other connection.
- A tool's inability to determine a net does not prove the design is wrong. Classifying an alert does not prove the tool fully checked the pad. Record each alert's classification, basis, and unfinished checks.
- Do not force a ground or change a net merely to clear an alert.

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

The current plugin cannot move PCB designators independently and has no command to place mounting holes or standalone pads. Make those changes manually in the EDA interface, then read them back.

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

## Plan Routing Paths

- Route critical loops and the hardest pin exits first.
- Before routing, trial-route or inspect real geometry for constrained exits and shared corridors. Use actual pads, layers, widths, clearances, vias, and obstacles on all layers.
- No component overlap does not prove the board is routable. A trial covers only the checked scope; record predicted paths separately from completed routes.
- Shared corridors must fit all related traces at once; do not count the same space repeatedly as each individual trace passes.
- Plan exits from both ends, main corridors, branches, layer changes, and returns. Reserve exits for unrouted pins, power, and ground too.
- Do not change IC pin assignment or connector pin order solely to make routing look orderly.
- For a simple straight corridor, estimate width from trace widths, clearances, and side margins. Calculate additional space separately for bends, branches, vias, and returns.
- Do not require horizontal routing on the top layer or vertical routing on the bottom layer.

## Power, Signals, and Sensing

- Trace each current path from supply to load and back. Check components, connectors, pads, narrow copper, via groups, and planes.
- Check current, voltage drop, loss, and temperature rise under actual operating conditions. Identify loops with rapidly changing current by switching state.
- Follow IC requirements for switch nodes, gates, and bootstrap loops. A large copper area does not replace path analysis.
- Evaluate communication traces against transceiver, edge rate, load, protocol, and cable. Determine differential impedance and timing from the actual interface and stackup.
- Measure paths from source to each receiver. Total net copper length does not replace endpoint path or timing-skew checks.
- Check every required pin on multi-pin same-net connectors. Check bidirectional buses for their actual driver states and choose branch topology for the interface and load.
- Do not add serpentine length to ordinary control or PWM traces when there is no length-matching requirement.
- Route sense positive and negative from the actual sense locations. Do not include a power-drop segment that must not be shared in a sense path.

## Record High-Current Paths by Segment

- Record each connector, trace or plane, component pad, via group, and return path in connection order.
- For every segment, state continuous current, peak current, and the duration of each.
- Record the narrowest location, actual dimensions, and copper thickness for each segment.
- For via groups, record drill diameter, via count, plated barrel thickness, and connection method. Distinguish drill diameter from finished-hole diameter.
- Mark missing parameters pending; do not fill them with tool defaults.
- Record the basis and pending checks for ampacity, voltage drop, and temperature rise per segment.
- Outer-layer copper thickness does not specify via barrel plating. Via count alone does not prove via-group current capacity or temperature rise.
- A large copper pour or zero DRC errors alone does not prove current capacity. Part-specific thermal-via guidance is maintained in `component-pcb-profiles`.

## Vias and Copper Pours

- Check signal, ground, current-carrying, and thermal vias separately.
- `placeVia` reads the via back and requests flyline recalculation. `connectivityVerified:false` means cross-layer connectivity is not yet confirmed. Refresh and use connectivity checks to verify the actual state.
- Complete required fanout before creating or rebuilding copper pours. Generate and execute fanout plans for different nets one at a time; after execution, reload obstacles and available paths.
- Preserve required return and thermal paths while minimizing layer changes. Do not estimate parallel-via capacity by simply multiplying by via count. Via-in-pad requires support from the footprint and selected fabrication process.
- For pours, check net, layer, boundary, clearance, and connection style. Check priorities, island removal, and manufacturing options. Balance thermal relief connections for current, heat dissipation, and soldering.
- Rebuild copper after changing related geometry. Confirm automatic rebuild settings work and check that the generated copper is continuous.

## Rerouting and Comparison

- State which components may move, which traces may change, and which connections must remain.
- For one pin-exit problem, adjust locally first. If a shared corridor is constrained, check the whole related functional group.
- If routing repeatedly detours around the same obstacle, inspect the placement cause first.
- After deletion or shove routing, inspect segments, clipping, neighboring traces, and endpoints outside the edited area.
- Compare alternatives with identical endpoints, operating conditions, and scope. Record route, layer changes, returns, and neighboring impacts for all affected interfaces.
- Failing to find a better route does not prove a layer change is necessary. Shorter routing or fewer vias do not offset electrical, mechanical, or manufacturing problems.

## Before-and-After Comparison

Follow the [PCB command workflow](commands-pcb.md) for modification, deletion, and saved readback. Compare nets and geometry, and retain unexplained differences for review.

- After same-net traces merge, check endpoints, route, layer, and width.
- When a generated copper ID changes, separately check the boundary, filled geometry, and connectivity.
- Report ID-only changes separately from actual copper changes.

## Silkscreen and Interface Markings

- Inspect standalone text, component designators, and markings inside footprints separately.
- Check text height, stroke width, and minimum spacing for the actual process.
- After enlarging text, recheck its clearance from pads, solder-mask openings, board edge, and adjacent text.
- Check bottom-side text orientation and pin order in the actual bottom-side view. For reverse text, check the background area and complete characters.
- If the tool cannot change a component property, list the unfinished objects. Passing a dimension check does not replace visual review.

## Completion Checks

- Check connectivity, designators, footprints, polarity, and every repeated channel.
- Check critical loops, sensing, and return current.
- Check manufacturing clearances, holes, solder mask, silkscreen, and board edge.
- Check component bodies and height, insertion/removal, and assembly clearance.
- Check test access, pin order, mask openings, and rework clearance.
- Before identifying a final revision, run the complete DRC. Real-time and custom DRC must not be presented as a complete check.
- Clearing an error marker does not mean the problem is fixed. Before height checks, verify rules, models, and height attributes are valid.
- Inspect estimated warnings against their actual objects; do not ignore or reject all warnings by default.
- Recheck affected areas after edits and record the saved revision and remaining issues.

## Run DFM After DRC

After complete DRC passes, run PCB DFM and applicable SMT manufacturing/assembly checks for the intended order process. Use the DFM command reference linked from the skill entry and check the installed version, parameters, and coverage limits.

- Verify target PCB, saved revision, material, board thickness, copper thickness, stackup, and assembly process.
- Compare the drawing, check inputs, and intended order process; record differences and their resolution.
- Check report completeness, item-level results, and coverage; API success alone is insufficient.
- Use an applicable method to check required items that were skipped, unsupported, or approximated, and keep the basis.
- Do not replace an unsupported process with a supported default just to obtain a pass.
- After fixes, rerun checks. Keep complete DRC and applicable DFM results for the final submission revision.
- If manufacturer parsing is required, export check files and upload under existing authorization. Do not submit the order until parsing passes.

Report the result revision, input process, item-level outcomes, supplemental-check basis, and unresolved issues for project-stage acceptance. Passing within the tool's coverage does not mean all manufacturing requirements pass.
