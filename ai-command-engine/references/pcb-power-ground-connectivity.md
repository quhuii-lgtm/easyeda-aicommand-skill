# Power and Ground Tie-In to Actual Copper

Identify required pads and confirmed supply, ground or reference anchors. Trace analog sensing returns, digital signal returns and load-current paths separately. Choose junctions from the schematic and device requirements.

| Stage | Evidence required |
| --- | --- |
| Local pad group | Required pads connect through actual copper on the intended net. |
| Layer transition | The local group contacts a plated via spanning the required layers. |
| Actual fill | The via contacts continuous fill on the intended layer directly or through actual thermal spokes. |
| Main path anchor | The verified path reaches the identified supply or return anchor. |

Record net, layer, locations and the PCB revision. Check whether voids break the path. A common net name, a via inside a pour boundary or no visible airwire does not prove the main path tie-in.

## Refresh Fill and Resolve Conflicting Evidence

- When a routing batch may affect a supply or return path, decide whether and where to add keepouts from the current fill, connection points, clearances and available routing space. Preview proposed and skipped regions with `pcb.planCopperKeepouts` and apply suitable plans with `pcb.applyCopperKeepouts`. For a skipped region, use verified geometry to decide whether to place a local routing-only keepout or change the route.

- Distinguish adding or editing copper regions from refreshing existing fill. A refresh can change connections. Follow the agreed repour scope, mark unconfirmed fill freshness and recheck existing supply, ground and reference connections after a refresh.
- When refreshing existing fill, pass the affected nets as `protectNets` to `pcb.rebuildPour`. Check airwires, DRC, and the actual copper path before accepting the result. If readback fails or a new disconnection appears, pause dependent saves and inspect the current copper. The completed repour remains on the board.
- Use `pcb.getPourFillReadback` for available fill and `pcb.reviewCopperShape` for supported shapes and requested cross-sections alongside pad, track, via and DRC readbacks. Current commands do not automatically prove complete cross-layer connectivity, island status or the narrowest point across a whole pour. Verify sections independently when evidence allows and mark gaps.
- If native DRC and copper readback disagree, retain the native finding and its revision. Independently check pads, tracks, vias, fill and thermal spokes to the anchor. Verify any suspected change of reported representative object by net, layer, location and actual geometry.
- Report the native finding and independent conclusion separately. Limit conclusions to the checked saved revision and confirm by reopen readback. Avoid redundant traces added only to clear a marker or permanent suppression of the warning class.
