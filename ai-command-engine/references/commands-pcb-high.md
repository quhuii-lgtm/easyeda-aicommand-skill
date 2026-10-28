# High-Frequency PCB Commands

This task index does not indicate call counts or verification status. Check command parameters in `GET /help?cmd=<command>` for the active window. Coordinates and lengths are often in mil; follow help. Before the first PCB write, read [PCB operating requirements](PCB操作要求.md) and [PCB command details](commands-pcb.md) in full. See [optional tool offer rules](PCB操作要求.md#pcb-optional-tools) and [completion checks](PCB操作要求.md#pcb-completion-checks).

| Task | Commands | Purpose and limits |
| --- | --- | --- |
| Inspect board | `pcb.listComponents`, `pcb.getComponentPads`, `pcb.listNets`, `pcb.listLayers` | Read components, pads, nets, and layers. |
| Placement and outline | `pcb.moveComponent`, `pcb.checkPlacement`, `pcb.drawOutline` | Move components, check spacing, and create the board outline. |
| Designators and silkscreen | `pcb.modifyComponentAttribute`, `pcb.checkSilkscreen` | Change a designator attribute or inspect silkscreen candidates. Renaming does not renumber; silkscreen results may be incomplete and candidates are not confirmed collisions. |
| Holes, pads, vias | `pcb.placeHole`, `pcb.placePad`, `pcb.placeVia` | Create mechanical holes, standalone SMD pads, or vias. Choose hole type, plating, and dimensions from the design and manufacturing requirements. |
| Routing | `pcb.routeTrack` | Route a net along a path. The plugin currently rejects segments shorter than 1 mil (25.4 μm) before writing; this is a plugin rule, not an SDK limit. |
| Copper pours | `pcb.pourCopper`, `pcb.listPours`, `pcb.rebuildPour` | Create, inspect, or rebuild pours. `pourCopper` creates only a boundary; rebuild and read back fill. `no-fill` does not mean a completed pour. |
| Checks and save | `pcb.runDrc`, `pcb.runDrcDetailed`, `pcb.getNetInfo`, `pcb.save` | Run DRC, inspect a net, and save. A clean DRC alone does not prove manufacturability. |
| Manufacturing checks | `pcb.runDfm`, `pcb.runSmtDfm`, `pcb.checkSameNetPadSpacing` | Check PCB process, SMT placement, or same-net pad spacing. Review each command's coverage and unknowns. |
| Manufacturing output | `pcb.exportGerber`, `pcb.exportPickPlace` | Export Gerber or placement data. Check each output for the current project. |

`pcb.connectComponentPadDirect` is a retained but disabled compatibility entry. On EDA 4.1.78, it rejects before accessing the project or SDK with `disabled:true`, `retryable:false`, and `writeAttempted:false`. Read-only per-pad inspection remains available through `pcb.getComponentPads`; configuration readback does not prove the host used that connection rule.

Official references: [90-degree arc equal-length style](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/index.html), [ARC API](https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_primitivearc.create.html), and [PCB ARC format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/arc.md). Documentation does not replace testing in the active host.
