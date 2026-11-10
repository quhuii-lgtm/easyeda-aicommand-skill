# Schematic 2 · Place and Arrange Components

Verify the window, project, and page using [Connection and Environment](setup.md). Use `__help` in the target window for parameters, defaults, and results.

## Components and Footprints

- Check pin numbers and names, electrical types, and hidden pins.
- Units in a multi-unit symbol must represent the same physical component.
- For components transferred to PCB, map every symbol pin to a footprint pad.
- Footprints may contain extra pads; determine their purpose.
- Symbol pin count does not have to equal pad count.
- Check non-board symbols, such as net identifiers, according to their purpose.
- Verify model, parameters, part number, and footprint.
- Check BOM inclusion, PCB transfer, and assembly status.
- A 3D model does not prove pin mapping is correct.

## Components and Branches

- Place components by connection group. Read actual pins, then orient and position parts so pins intended for a direct wire face each other on the same axis.
- Align related parts in rows or columns where practical. Adjust by actual pin positions and clearances when alignment would cause detours, symbol crossings, or crowded text.
- Before wiring, place parallel parts and feedback branches close together. Align them where practical and choose orientations using the actual pin exits.
- Record the chosen alignments, pin pairs intended for straight wires, path-length targets, and area size targets for this block.
- After rework or resizing, read back component anchors, pins, and the area box. Check the latest close-up for space around titles, net names, designators, values, and NC marks.
- Orient resistors and capacitors to the pins they connect to, reducing detours. Input or output bypass capacitors may be placed vertically beside the corresponding IC side.
- Connect capacitor power ends to a short bus and join ground ends nearby. Keep upper and lower buses near the components while allowing room for text.
- Check actual pins and polarity; do not add long wires for visual symmetry.
- If a component cannot fit between two pins, prioritize a direct connection to the positive or signal pin. A negative or ground pin may use a label with a short wire. If space and routing allow, connect both ends directly nearby.
- Put termination resistors and similar branches by their interface and verify each pin's original net. Do not detour or cross other pins just to connect both ends directly.

## Decoupling Capacitors

- Place each decoupling capacitor near its corresponding power pin and connect it directly to that pin and a nearby ground return when possible.
- Minimize the high-frequency loop formed by power pin, capacitor, and ground return; straight-line distance to the IC is not enough.
- Parallel different decoupling values on the supply net and verify the power and ground side of every capacitor.
- Keep capacitor, designator, and net-label text clear so the connections remain readable.

## Place, inspect, and adjust

- `schematic.placeDevice` places one component. Check required fields and coordinates in current help. `lcscId` and `libraryUuid` can constrain the library; omitting the library uses the SDK search scope. The returned `device` identifies the actual device and library. `placementVerified` confirms instance readback only; `footprintVerified`, `footprintStatus`, `pcbReady`, and `pcbReadyScope` describe the checked footprint and pin/pad mapping scope. A symbol without a footprint may still be placed with a warning. If creation or readback is abnormal, inspect the current project; do not replay the placement. Use `schematic.getPlacementResourcesDiagnostic` for read-only checks of existing instances.

- `schematic.modifyComponent` submits a complete properties object. Read existing project properties first and preserve custom `otherProperty` keys; do not overwrite project instances with library defaults.

- `schematic.setAttribute` changes an existing attribute using current help. A target or parameter lookup failure is rejected before writing. Exceptions after invocation, waits, or unconfirmed readback must be treated as `partial:true`, `retryable:false`. Check the attribute and call state; do not replay directly.

- `schematic.moveComponent` does not move existing wires. Use `schematic.autoLayout` only to arrange an existing functional area: constrain the target, run `dryRun`, and save before execution. `rewire` deletes and recreates related wires; inspect skipped wires and partial moves. On failure, check `error.cause.moved` and current state; do not assume rollback.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Place components | `schematic.placeDevice` | Check footprint resources and pin mapping after placement; successful placement does not mean it is ready for PCB transfer. |
| Modify | `schematic.moveComponent`, `schematic.modifyComponent`, `schematic.setAttribute` | Move components or modify components and attributes. |
| Resource checks and layout | `schematic.getPlacementResourcesDiagnostic`, `schematic.autoLayout`, `schematic.getAttributes` | Check resources, preview layout, and inspect attributes. |
