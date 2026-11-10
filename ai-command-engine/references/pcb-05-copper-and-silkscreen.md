# PCB 5 · Add Copper and Silkscreen

Use `__help` in the target window for parameters, defaults, results, and examples.

## Vias and Copper Pours

- Check signal, ground, current-carrying, and thermal vias separately.
- `placeVia` reads the via back and requests flyline recalculation. `connectivityVerified:false` means cross-layer connectivity is not yet confirmed. Refresh and use connectivity checks to verify the actual state.
- Complete required fanout before creating or rebuilding copper pours. Generate and execute fanout plans for different nets one at a time; after execution, reload obstacles and available paths.
- Preserve required return and thermal paths while minimizing layer changes. Do not estimate parallel-via capacity by simply multiplying by via count. Via-in-pad requires support from the footprint and selected fabrication process.
- For pours, check net, layer, boundary, clearance, and connection style. Check priorities, island removal, and manufacturing options. Balance thermal relief connections for current, heat dissipation, and soldering.
- Rebuild copper after changing related geometry. Confirm automatic rebuild settings work and check that the generated copper is continuous.

## Silkscreen and Interface Markings

- Inspect standalone text, component designators, and markings inside footprints separately.
- Check text height, stroke width, and minimum spacing for the actual process.
- After enlarging text, recheck its clearance from pads, solder-mask openings, board edge, and adjacent text.
- Check bottom-side text orientation and pin order in the actual bottom-side view. For reverse text, check the background area and complete characters.
- If the tool cannot change a component property, list the unfinished objects. Passing a dimension check does not replace visual review.

## Copper and silkscreen

`pcb.pourCopper` creates a copper boundary. Use `pcb.rebuildPour` and inspect actual fill; use `pcb.getPourFillReadback` if needed. `no-fill` does not mean a completed pour, and a boundary is not interchangeable with fixed copper `fill`.

Do not use `pcb.modifyPour` to change the net or name of an existing pour. If necessary, edit in EDA, then rebuild and verify; do not present automated delete-and-recreate as a lossless edit.

Use `pcb.modifyComponentAttribute` to adjust designator position, angle, font, or visibility. Use `pcb.placeString` and `pcb.modifyString` for ordinary text. Check mirroring and readability for bottom-side text.

`pcb.checkSilkscreen` is read-only and checks text, designators, available package silkscreen, pad openings, and board edge. Judge manufacturing-geometry conflicts separately from source-object candidates. Report unique-source attribution, ambiguous matches, and uncovered primitives as returned; a candidate is not a confirmed conflict. See [PCB special topics](pcb-05-copper-and-silkscreen.md) for parameters and coverage.

## Silkscreen spacing

`pcb.checkSilkscreen` separately checks readable silkscreen objects in the current PCB and manufacturing output. Use current help for scope, parameters, and response. SDK sources may include lines, arcs, and polylines. Distinguish package-local geometry from board-level objects; do not present a local primitive ID as a board-level SDK ID.

SDK candidates screen same-side text, designators, lines, arcs, polylines, and pads by available geometry. Bounding-box overlap calls for review; it is not exact glyph/ink collision. When source mapping is unclear, enumeration incomplete, or geometry unsupported, inspect `coverage`, `unsupported`, and completeness. Do not report candidates with `confirmed:false` or overall `complete:false` as passing. Copper layers and opposite-side objects are not compared.

Manufacturing analysis parses supported Gerber layers and reports side, category, and geometric conflicts; read those results separately from SDK candidates. Complete output means supported syntax parsed completely, not that every font, macro, arc, package source, or board rule was covered. Region totals may differ from independent collision counts. Auxiliary boxes or nearby sources are candidates, not unique manufacturing-source proof. Neither path modifies the board.

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Designators and silkscreen | `pcb.modifyComponentAttribute`, `pcb.checkSilkscreen` | Change a designator attribute or inspect silkscreen candidates. Renaming does not renumber; silkscreen results may be incomplete and candidates are not confirmed collisions. |
| Copper pours | `pcb.pourCopper`, `pcb.listPours`, `pcb.rebuildPour` | Create, inspect, or rebuild pours. `pourCopper` creates only a boundary; rebuild and read back fill. `no-fill` does not mean a completed pour. |
| Copper, text, and silkscreen | `pcb.getAutoCopperPlan`, `pcb.autoCopper`, `pcb.getPourFillReadback`, `pcb.getNetSilkscreenPlan`, `pcb.generateNetSilkscreen`, `pcb.listStrings`, `pcb.placeString`, `pcb.modifyString`, `pcb.modifyPour` | Inspect the plan or target first and read back after writes. |
