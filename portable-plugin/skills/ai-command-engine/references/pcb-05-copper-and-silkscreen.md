# PCB 5 · Add Copper and Silkscreen

Use `__help` in the target window for parameters, defaults, results, and examples.

## Vias and Copper Pours

Use [Power and Ground Tie-In](pcb-power-ground-connectivity.md) to verify actual fill, thermals and the main path when working on power, ground or reference copper. Record new regions and refreshed fill separately.

- Check signal, ground, current-carrying, and thermal vias separately.
- `placeVia` reads the via back and requests flyline recalculation. `connectivityVerified:false` means cross-layer connectivity is not yet confirmed. Refresh and use connectivity checks to verify the actual state.
- Schedule global power, ground and pours according to the project plan. Final pours normally follow stable placement and main routing. Generate and execute fanout plans one net at a time, then reload obstacles and available paths.
- Preserve required return and thermal paths while minimizing layer changes. Do not estimate parallel-via capacity by simply multiplying by via count. Via-in-pad requires support from the footprint and selected fabrication process.
- For pours, check net, layer, boundary, clearance, and connection style. Check priorities, island removal, and manufacturing options. Balance thermal relief connections for current, heat dissipation, and soldering.
- When checking copper against updated routing, refresh existing fill within the agreed scope. If automatic rebuild is enabled, read back the actual fill before checking continuity.

## Silkscreen and Interface Markings

- Canvas-layer display colors are available through `pcb.getSilkscreenColors` and `pcb.setSilkscreenColor`. `side` accepts `top`, `bottom`, or `both` and defaults to `top`; `color` uses `#RRGGBB`. This changes display colors only, not manufacturing or 3D colors; it does not save automatically. Read back with `pcb.getSilkscreenColors` to confirm. Check `__help` for full parameters and results.
- Inspect standalone text, component designators, and markings inside footprints separately.
- Check text height, stroke width, and minimum spacing for the actual process.
- After enlarging text, recheck its clearance from pads, solder-mask openings, board edge, and adjacent text.
- Check bottom-side text orientation and pin order in the actual bottom-side view. For reverse text, check the background area and complete characters.
- If the tool cannot change a component property, list the unfinished objects. Passing a dimension check does not replace visual review.

## Place PCB Primitives and Images

Use these commands for non-electrical drawing objects. Use `pcb.routeTrack` for electrical copper routing; `pcb.placeLine` is for non-copper drawing lines and returns a polyline object. Check the target layer with `pcb.listLayers`, create or modify the object, then list it again and verify the returned properties. Save and reopen before treating a placement as persistent.

For supported primitive placements or property changes, use `pcb.runEditBatch`: review its default dry run, confirm the ordered steps and target, then explicitly request execution. Only registered primitive placement/modification commands are accepted; image insertion and electrical routing are excluded. It groups steps as one undo group and does not run DRC. A failure is rolled back only when the failed step is confirmed not to have written and the group rollback is verified; for `partial` or `unknown`, preserve the current state and inspect it before continuing. Undo or redo after a completed batch is done in the EDA interface.

- Use `pcb.placeArc` for copper-layer arcs. For non-copper curved graphics, use `pcb.placePolyline` with an `ARC` path segment. The `pcb.placeLine` two-point line is also represented as a polyline.
- Use `pcb.placeFill` for a fixed solid fill primitive. Grid fill and custom fill line width are not supported. A fixed fill is not a copper pour.
- Use `pcb.placeRegion` for keepout or constraint regions. Keepout regions do not retain a custom name. A name is available only for a region whose `ruleType` includes `9`; this does not prove that external design rules are bound.
- Use `pcb.placeDimension` for length or angle annotations; angle values are in degrees. In this release, do not create or modify radius dimensions. You may read existing radius dimensions with `pcb.listDimensions`.
- `pcb.placePad` does not support a true ellipse: save-and-reopen changes it into a circle. Use a circle or oval instead.
- `pcb.placeImage` accepts PNG data and traces it into monochrome vector contours. It does not preserve a color bitmap. Use `pcb.listImages` or `pcb.modifyImage` to inspect or change an existing image's placement properties.

Read complete parameters and enum values from `__help` in the target PCB window.

## Copper and silkscreen

`pcb.pourCopper` creates a copper boundary. Use `pcb.rebuildPour` and inspect actual fill; use `pcb.getPourFillReadback` if needed. `no-fill` does not mean a completed pour, and a boundary is not interchangeable with fixed copper `fill`.

Use `pcb.pourCopper` or `pcb.modifyPour` for a straight-sided polygon outline. Check the layer, net and vertices, then rebuild the specified pour and read the fill paths. Use EDA's copper-zone controls when you need a direct or thermal connection local to one copper zone. Use `pcb.reviewCopperShape` to inspect supported filled geometry and requested cross-sections; read its coverage before interpreting measurements. Cross-sections are only measured at the requested locations, not searched for the narrowest point over the whole pour. Sharp-corner candidates cover straight-connected corners on the outer contour only.

Do not use `pcb.modifyPour` to change the net or name of an existing pour. If necessary, edit in EDA, then rebuild and verify; do not present automated delete-and-recreate as a lossless edit.

Use `pcb.modifyComponentAttribute` to adjust designator position, angle, font, or visibility. Use `pcb.placeString` and `pcb.modifyString` for ordinary text. Check mirroring and readability for bottom-side text.

`pcb.checkSilkscreen` is read-only and checks text, designators, available package silkscreen, pad openings, and board edge. Judge manufacturing-geometry conflicts separately from source-object candidates. Report unique-source attribution, ambiguous matches, and uncovered primitives as returned; a candidate is not a confirmed conflict. See [PCB special topics](pcb-05-copper-and-silkscreen.md) for parameters and coverage.

The API changes the active layer color; the inactive color keeps its existing EDA setting.

## Silkscreen spacing

`pcb.checkSilkscreen` separately checks readable silkscreen objects in the current PCB and manufacturing output. Use current help for scope, parameters, and response. SDK sources may include lines, arcs, and polylines. Distinguish package-local geometry from board-level objects; do not present a local primitive ID as a board-level SDK ID.

SDK candidates screen same-side text, designators, lines, arcs, polylines, and pads by available geometry. Bounding-box overlap calls for review; it is not exact glyph/ink collision. When source mapping is unclear, enumeration incomplete, or geometry unsupported, inspect `coverage`, `unsupported`, and completeness. Do not report candidates with `confirmed:false` or overall `complete:false` as passing. Copper layers and opposite-side objects are not compared.

Manufacturing analysis parses supported Gerber layers and reports side, category, and geometric conflicts; read those results separately from SDK candidates. Complete output means supported syntax parsed completely, not that every font, macro, arc, package source, or board rule was covered. Region totals may differ from independent collision counts. Auxiliary boxes or nearby sources are candidates, not unique manufacturing-source proof. Neither path modifies the board.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Canvas silkscreen display color | `pcb.getSilkscreenColors`, `pcb.setSilkscreenColor` | Read or set top/bottom/both canvas display colors; does not change manufacturing or 3D colors or save automatically. Read back to confirm. |
| Designators and silkscreen | `pcb.modifyComponentAttribute`, `pcb.checkSilkscreen` | Change a designator attribute or inspect silkscreen candidates. Renaming does not renumber; silkscreen results may be incomplete and candidates are not confirmed collisions. |
| Copper pours | `pcb.pourCopper`, `pcb.listPours`, `pcb.rebuildPour` | Create, inspect, or rebuild pours. `pourCopper` creates only a boundary; rebuild and read back fill. `no-fill` does not mean a completed pour. |
| Copper shape check | `pcb.reviewCopperShape` | Inspect one identified pour and optional cross-sections; read the coverage to see which outline, openings, and copper widths were measured. Cross-sections are not a whole-pour minimum search; sharp-corner candidates cover only straight-connected outer-contour corners. Electrical connectivity and islands are not proved. |
| PCB drawing primitives | `pcb.listArcs` / `pcb.placeArc` / `pcb.modifyArc`, `pcb.listFills` / `pcb.placeFill` / `pcb.modifyFill`, `pcb.listRegions` / `pcb.placeRegion` / `pcb.modifyRegion`, `pcb.listPolylines` / `pcb.placePolyline` / `pcb.modifyPolyline`, `pcb.listDimensions` / `pcb.placeDimension` / `pcb.modifyDimension`, `pcb.placeLine` | Use for non-electrical graphics and annotations. Copper-layer arcs are supported; non-copper lines and curves use polylines. Fixed fills are solid only; keepout regions cannot retain custom names. Length and angle dimensions are supported; radius dimensions are read-only in this release. Use `pcb.routeTrack` for electrical routing. |
| Primitive edit batch | `pcb.runEditBatch` | Preview the ordered primitive placement/property edits, confirm the target, then explicitly execute them as one undo group. It does not run DRC. Unknown results require inspection before retry. |
| PCB images | `pcb.placeImage`, `pcb.listImages`, `pcb.modifyImage` | Place PNG input as monochrome vector contours; color bitmap data is not preserved. Read back the image object and inspect it on the board. |
| Copper, text, and silkscreen | `pcb.getAutoCopperPlan`, `pcb.autoCopper`, `pcb.getPourFillReadback`, `pcb.getNetSilkscreenPlan`, `pcb.generateNetSilkscreen`, `pcb.listStrings`, `pcb.placeString`, `pcb.modifyString`, `pcb.modifyPour` | Inspect the plan or target first and read back after writes. |
