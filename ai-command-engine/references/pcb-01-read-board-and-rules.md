# PCB 1 · Read the Board and Set Rules

Use `__help` in the target window for parameters, defaults, results, and examples.

## Required Operation Order

First identify whether this task covers placement, a local change, whole-board routing, or manufacturing delivery. Work only on this round and affected objects; reuse accepted work. Do not guess missing process, mechanical, or electrical parameters.

1. Read the current project, PCB, schematic association, components, actual pads, and nets. The user initiates schematic-to-PCB updates in EDA. After an update, read it back and use the [optional tools](pcb-01-read-board-and-rules.md#pcb-optional-tools) rules to ask whether functional-region marks or component-moving groups are wanted; treat them as separate choices.
2. Check outline, holes and slots, fixed interfaces, keepouts, layers, applicable physical stackup, and actual net/layer/region rules. State what may move or be rerouted and what must remain.
3. Place fixed interfaces, critical local circuits, the controller, and ordinary components in that order, using actual connectivity, pads, and return paths. Group only if selected.
4. Before routing, check actual pad exits, shared corridors, vias, and space on all affected layers. Trial-route or inspect real geometry where constrained. Resolve conflicts through related placement or path changes; autorouter success cannot hide placement problems.
5. Route critical loops and constrained traces first, then ordinary traces and every required power/ground pad. For selected fanout, differential, length-tuning, or autorouting tools, read back and verify actual paths and connectivity.
6. After required fanout and rerouting, rebuild copper. Check actual fill, islands, and return continuity; then arrange silkscreen and interface markings. If related copper or nets change later, recheck affected pours and connectivity.
7. Check nets, critical loops, mechanical assembly, and board appearance. Run complete DRC on a final whole-board revision. For manufacturing delivery, run applicable DFM/SMT checks and verify output files against the actual process.
8. Complete the [completion checks](pcb-06-verify-and-save.md#pcb-completion-checks), saving and reopening at the applicable scope. Report scope, basis, and missing items. A placement-only or local task must not be called a fully routed board or production-ready.

Local placement and routing may be iterated. Resolve prerequisites before dependent work; do not restart unrelated stages or require step-by-step confirmation.

<a id="pcb-optional-tools"></a>
## Optional Tools and When to Offer Them

Grouping, autorouting, and the automatic arrangement or optimization tools below are optional methods, not mandatory steps for every board. When conditions are met and the user has not already chosen, proactively explain the use and impact and ask. Related choices may be asked together. Reuse an explicit choice without asking again.

| Optional tool | When to offer | What to do if selected |
| --- | --- | --- |
| Schematic functional-region marks and highlighting | After the target PCB and its schematic association are verified; ask whether to mark or locate regions. | Read memberships and unmatched objects with `pcb.getSchematicRegions`, including locked members. Preview `pcb.markSchematicRegions` with its default `dryRun:true`; execute only after an explicit choice with `dryRun:false`, then read back, save, close, reopen, and verify. `pcb.locateSchematicRegion` only locates/highlights and does not write design data. |
| Component-moving groups | Only when the user explicitly wants components moved and has reviewed the impact. | `pcb.groupBySchematicRegions` moves components while making groups. This is separate from region marks and highlighting; do not call it by default. |
| Autorouting | When routing is in scope, placement/rules/constrained corridors are checked, and DSN/layer mapping plus online service or external CLI are available. | Online: export DSN, start and query task, retrieve SES, explicitly import, then accept. External CLI: export DSN, run the selected CLI, explicitly import SES. If not selected, use the authorized ordinary routing method. |
| Dense-pin fanout | When dense pads or layer exits need fanout and actual pads, nets, widths, vias, and obstacles are known. | Prepare a plan, verify executable scope, execute and inspect. Not selecting a macro does not waive required escapes or connections. |
| Differential routing / length tuning | When differential or timing requirements are confirmed, nets, reference plane, target, and tolerance are clear, and the geometry tool is useful. | Plan and execute within supported scope. Do not add length to ordinary control traces without cause. Not selecting a tool does not waive confirmed differential or timing requirements. |
| Automatic copper / pad expansion | When local current-carrying or connection needs are explicit and target pad, net, layer, and dimensions can be verified. | Explain which copper geometry will change; plan, execute, and read back. Do not expand unrelated pads. |
| Net-label silkscreen | When nets are verified, additional net labels are needed, and silkscreen space is inspectable. | Explain label scope and impact; preview, generate, then check openings, board edge, and readability. |

- If the user does not reply, do not execute an optional tool; continue reads and checks that do not depend on that choice. If prerequisites are missing, state them; a proposal is not authorization.
- If the user says no, continue the ordinary workflow without adding that tool merely to pass acceptance. Offer again only if conditions or scope materially change, explaining why.
- Ordinary readback, necessary operations already authorized for this task (including required routing or copper rebuild), and acceptance are part of the workflow; do not turn each into a separate approval prompt.
- Confirmed electrical, mechanical, and manufacturing requirements still apply. The tool or organizing method is optional; compliance with the design requirements is not.

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

## Read the design and current board

The user initiates and confirms schematic-to-PCB updates in EDA. AI does not call `pcb.importChanges` or the official import API. Read components, footprint links, pad nets, and non-target objects before and after an update; a sync request is not proof that sync completed.

Use `pcb.listComponents`, `pcb.getComponentPads`, `pcb.listNets`, and `pcb.listLayers` to inspect the active board. Get object IDs from the current PCB; do not reuse IDs from screenshots or another project. Check pad-array indexes (one-based) separately from runtime IDs.

## Outline and layers

- `pcb.drawOutline` uses lower-left coordinates and dimensions in mil. Before drawing another outline, inspect existing primitive types and IDs.
- `pcb.setCopperLayers` sets copper-layer count but does not configure physical stackup. Read back after applying a stackup; a default stackup is not proof it is applied to the current PCB.
- Use layer names and numbers from current help. Do not guess unknown names; confirm inner layers are available on this board.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Inspect board | `pcb.listComponents`, `pcb.getComponentPads`, `pcb.listNets`, `pcb.listLayers` | Read components, pads, nets, and layers. |
| Net classes and length groups | `pcb.createDiffPair`, `pcb.listDiffPairs`, `pcb.deleteDiffPair`, `pcb.createNetClass`, `pcb.listNetClasses`, `pcb.addNetToClass`, `pcb.removeNetFromClass`, `pcb.deleteNetClass`, `pcb.renameNetClass`, `pcb.createEqualLengthGroup`, `pcb.listEqualLengthGroups`, `pcb.renameEqualLengthGroup`, `pcb.deleteEqualLengthGroup`, `pcb.addNetToEqualLengthGroup`, `pcb.removeNetFromEqualLengthGroup` | Manage net classes, differential pairs, and equal-length groups. Deleting a net class does not guarantee prior net colors are restored. Verify targets before changes. |
| Layers and stackup | `pcb.getCurrentLayer`, `pcb.selectLayer`, `pcb.setCopperLayers`, `pcb.setLayerVisible`, `pcb.setLayerLocked`, `pcb.listStackingConfigs`, `pcb.getStackingConfig`, `pcb.applyStackingConfig`, `pcb.saveStackingConfig`, `pcb.renameStackingConfig`, `pcb.deleteStackingConfig`, `pcb.setDefaultStackingConfig`, `pcb.addCustomLayer`, `pcb.removeCustomLayer`, `pcb.modifyLayer`, `pcb.setPcbType` | Inspect or set active layer, copper count, layers, and stackup. EDA 4.1.78 rejects `getCurrentLayer`, stackup commands, and real-time DRC commands with an EDA 4.2 requirement. A rejection is not a successful check. |
| Selection and cross-probe | `pcb.getSelection`, `pcb.select`, `pcb.clearSelection`, `pcb.crossProbe`, `pcb.getPrimitivesInRegion`, `pcb.getPrimitiveAtPoint` | Read or change selection, cross-probe, or locate primitives by region or point. |
| Outline and sync | `pcb.drawOutline`, `pcb.importChanges` | Draw the outline. The user confirms schematic sync in EDA. |
