# Schematic 4 · Verify and Deliver the Schematic

Verify the window, project, and page using [Connection and Environment](setup.md). Use `__help` in the target window for parameters, defaults, and results.

## Edits and Batch Operations

Use the the steps in this stage for edits, deletion, recovery, save, and readback.

- After moving, rotating, or mirroring a component, read its pin endpoints again. After rotation, plan wires from actual pin coordinates and directions returned by `schematic.listPins`; do not infer orientation from the designator or angle.
- A layout-only edit must preserve electrical connections and component parameters.
- Before modifying a shared wire, identify all branches and external endpoints.
- When replacing a component, recheck its full set of properties and assembly status.
- In Professional Edition, changing a value may clear the supplier number; recheck the part number afterward.
- The number of wire segments does not prove net connectivity.

## Compare Before and After

Use the the steps in this stage to compare component properties, nets, and positions. A layout-only edit must preserve connections and parameters; each electrical change must map to a requirement. Mark unexplained differences as pending verification.

<a id="schematic-completion-checks"></a>

## Schematic Completion Checks

First state the project, page, functional areas, and scope of this edit. Check only this scope and affected interfaces; a local value edit does not require rechecking the whole design. Use the agreed functional-area list, component list, and connection table. Do not report only that the work followed this skill.

## Acceptance Items, Methods, and Pass Conditions

| Item | How to check | Pass condition |
| --- | --- | --- |
| Functional areas | Compare the area list; use `listRects` to check box IDs and `span`, and `listTexts` plus the latest enlarged image to check titles, content membership, and box placement. | Every planned area has a real box and readable title; content is assigned correctly and boxes do not overlap. Do not compare only the total box count. |
| Components and layout | Compare the component list with readback of model, parameters, part number, designator, pin number, polarity, footprint, and assembly properties. Inspect enlarged area images and actual pins. | Properties and multi-unit mapping are correct; branches and decoupling capacitors are near their pins; symbols, designators, values, and titles are unobscured. |
| Wiring style | Use `listPins`, `listWires`, and the latest enlarged image to check endpoints, paths, junctions, lead direction, and label attachments. Re-read pins after rotation or mirroring. | Nearby same-net pins in an area are directly connected as required, including GND. Long and cross-area connections use suitable labels. Wires do not pass through symbols, other pins, or NC marks, and no extra stubs remain. |
| Direct-wire length | When grid spacing is known, sum every segment. For branches, check the longest of the shortest routes between every pair of endpoints; do not apply the limit separately to each segment. | Meets the default 40-grid-cell limit and clearance rules. If the grid is unknown, state the estimate and visual check; mark the length requirement incomplete rather than claiming a precise pass. |
| Actual connectivity | Compare each `designator + pin number → net` entry and net membership against the connection table. Use `getNetlist` for connectivity and `listNetLabels` for attachment and names. Check NC using pin properties or current valid source. | Required, prohibited, NC, connector pin order, and electrical types match the requirements. No missing, wrong, or unintended merged nets. A net name's presence alone is insufficient; a pin absent from the netlist is not proven NC. |
| ERC/DRC and structure | Run `runDrcDetailed` and applicable `structuralAudit`. Record checked pages and scope; inspect each error, warning, excluded object, and collision candidate. | No unresolved errors. Other warnings are fixed or handled as already agreed for the project. Candidates not visually checked, unknown result structures, or incomplete checks cannot pass. |
| Drawing and save | Inspect enlarged images of each changed area and the whole page for grouping and reading order. Save and check the saved content as described below. | Local and whole-page inspection is complete, and the saved object matches the accepted object. Old screenshots, thumbnails, command success, or zero DRC errors do not replace inspection. |

- Check each programming interface, test point, and removable 0-ohm link required by the design. State when an item is not applicable; do not add circuitry beyond the design requirements.
- Structural audit is a screening tool; it cannot prove that no area is missing or that every visual issue passes.
- Judge visual quality and electrical connectivity separately.
- Fix or inspect failed and incomplete items, then recheck only affected items. Rerun affected checks after rule changes.
- Do not hide issues by removing BOM or PCB inclusion or changing check rules. Report unexplained differences outside scope as incomplete.

## Block Self-Checks and Cross-Page Verification

After completing each functional block, run [check-schematic.mjs](../scripts/check-schematic.mjs) with `stage: "wiring"` on that block’s design and latest readback. Review the latest close-up and keep the block report. Resolve failures and complete required checks before accepting the block.
When all blocks on a page have been accepted, run the checker again with `stage: "sheet"` on the whole-page design and readback. Review the whole page, DRC, and save/reopen evidence before submitting the page under the project rules.
For cross-page connections, save, close, and reopen each affected page. Read the host netlist separately by page ID and compare the complete member set of every cross-page net.
Identify members by designator and pin number. Look for missing pins, extra pins, and merged nets. Keep the source of each read. If the host supplies a project-wide netlist, it is valid to read and compare all nets from each page.

When using `layoutPlan`, supply `blockReviews: [{ id, status, evidence }]` and `sheetReview: { status, evidence }` in the sheet readback.
Use `pass` or `fail` and reference the actual readback and drawings in `evidence`. Missing records remain incomplete.
Set `crossPage: { pageIds, nets }` in the design to list affected pages and independently expected nets. Set `reopenedPages: [{ id, evidence, nets }]` in the readback with a separate post-reopen capture for each page.
Both sides use `nets: [{ net, pins }]`, where `pins` lists designator and pin IDs. Use the same scope on both sides and retain any extra observed nets and members.
For unstable host-generated names, normalize only when the complete member set uniquely matches the independent expectation. Retain the original readback and report ambiguous matches as differences.
The checker verifies supplied records and net members. The operator still verifies drawing quality, DRC, the reopen operation, and the readback sources.

## Save and Reopen Scope

- For a new whole schematic or formal whole-schematic delivery: after writes finish and save is confirmed, close and reopen the affected page. Check page identity, key component properties, nets, areas and titles, and the latest image against the saved version.
- For an ordinary local value, text, or position edit: check the target and affected connections, properties, and drawing; save and confirm the current version. Reopening the whole project is not required.
- For local deletion, component replacement, rebuilt connections, or an explicit persistence check: save, reopen the affected page, and read back the relevant objects and nets. Also confirm non-target content is unchanged.
- If not reopened, report “Saved; reopen not verified.” Report “Save and reopen verified” only after reopening and checking the content. If the write or save result is unknown, check the existing operation first; do not force-close or resend.

## Report Acceptance Results

Use one concise table. Mark out-of-scope items not applicable and explain why; do not paste full raw responses. State the project, page, functional areas, and changes in scope. Give separate rows for area, component layout, wiring, length, actual connectivity, rules, drawing, and save, and identify the relevant area when there are several. Each row must state the item and scope, conclusion, evidence/method, and unresolved or incomplete items.

| Item and scope | Conclusion | Check basis | Unresolved or incomplete items |
| --- | --- | --- | --- |
| Functional area / acceptance item | Pass / fail / incomplete / not applicable | Object readback, netlist comparison, image actually inspected and its scope, or warning disposition. | Specific issue or missing check and reason; write “None” if clear, or explain why not applicable. |

For the save row, state “Saved; reopen not verified” or “Save and reopen verified” and what was checked. End with an overall conclusion. Any applicable failed item means the overall result fails; any required incomplete item means the overall result cannot be reported as passing.

## Transfer to PCB

- Verify project, board, schematic, target PCB, and assembly revision. In Professional Edition, schematic and PCB synchronization must target the same board.
- Save before synchronization and inspect the selected items in the change list. If rules must transfer, check “Include Design Rules” and its specific options.
- Apply the changes, then inspect the result. Verify each component, designator, footprint, pad net, and pin order.
- Do not combine production lists from different boards or assembly revisions.
- If nets change on a routed PCB, inspect old tracks, vias, branches, and copper zones. Repour as needed and recheck. Successful synchronization does not prove old copper still matches the new nets.

## Deletion, repair, and unknown results

- Before `schematic.delete`, verify target ID and dependencies, then rescan. Use `task.get` for long tasks; timeout does not mean cancellation. If any write outcome is unknown, stop dependent writes. To confirm persistence, save, close, reopen, then check identity, properties, nets, and non-target content.

- Delete TEXT through the supported delete API and check source and model. Immediate deletion may be undone after save/reopen on the current host; `directDeleted` does not confirm persistent deletion. If the result is unknown or readback is incomplete, stop. Do not switch to whole-page source writeback, retry, or compensate. Help documents this persistence limit; it does not disable every delete path.

## Checks, netlists, and export

- Use `schematic.listNets`, `schematic.listWires`, `schematic.getNetlist`, or `schematic.exportNetlist` to verify expected nets and pins, then run DRC.
- If closing DRC results from `schematic.runDrc`, `schematic.runDrcDetailed`, or `schematic.buildBlock` are not arrays or have unknown structure, the result is indeterminate, not a pass. `schematic.buildBlock` generates a complete functional block but does not replace component-by-component and connection checks.
- EDA 4.1 `listNets` may use a PADS netlist and named wires to list automatic net names, but `detail:true` does not guarantee that unnamed wires are assigned to automatic nets. Use `getNetlist` to inspect pins. Point and region primitive queries require EDA 4.2 or later.
- The JLCEDA format in `schematic.getNetlist` uses file generation and may update designators, Unique IDs, or save the project. Inspect the result before proceeding after a failure. Parse and verify the returned netlist.
- `schematic.exportNetlist` may also update designators, Unique IDs, or save the project. After `schematic.exportBom`, decode and inspect the file using its reported format.
- After saving, use `schematic.exportPng` to inspect the full page; decode by returned file type. Multi-page output may be ZIP. Background `editor.screenshot` may be stale. If two audit counts differ, wait for topology refresh and check again. Unknown DRC or structural-audit shapes are indeterminate, not a pass.
- `schematic.modifyText` is rejected on EDA 4.1.78 and requires EDA 4.2 or later. Persistence after save on 4.2 has not been confirmed; immediate readback is not proof of saving.

## Repairs and macros

- First inspect label problems read-only, then choose `pruneFloatingLabels`, `fixNetLabels`, `repairNet`, or `dedupeWireNets` as appropriate. Use `dryRun` where supported. `pruneFloatingLabels.dryRun` defaults to cleanup; `fixNetLabels.dryRun` defaults to preview. Check netlist and DRC afterward. Source rewrite is not a routine prerequisite; use it only when explicitly needed and backed up.
- Use `macro` only to combine known steps that need no intermediate decisions. Step results are under `steps`. Stop dependent steps on failure or unknown writes. If the next action depends on readback, submit it separately.

Replacing a complete component is not one ACE command. AI and a person must confirm the substitute, footprint, and pin mapping first. Module-reuse plugin RPC is not an ACE HTTP command. With ACE alone, back up the project, verify resources, pin mapping, nets, and properties; place the replacement, then delete the old component only after all checks pass. Recheck the netlist and non-target objects. The user initiates and confirms PCB update in EDA.

Official netlist references: [legacy string API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_netlist.getnetlist.html) and [file API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_manufacturedata.getnetlistfile.html).

## Command index

| Task | Commands | Purpose |
| --- | --- | --- |
| Check and save | `schematic.listWires`, `schematic.runDrc`, `schematic.getNetlist`, `schematic.save`, `schematic.exportPng` | Inspect wires, rules, and netlist; save and view the page. A clean DRC alone does not prove correct connectivity. |
| Export | `schematic.exportBom`, `schematic.exportNetlist` | Export a BOM or netlist. |
| Structural checks and deletion | `schematic.structuralAudit`, `schematic.runDrcDetailed`, `schematic.delete` | Inspect structure and DRC; delete verified targets if needed. |

## Candidate Reviews and Substitutions

Keep the original candidate checks. In the readback JSON, use `candidateReviews: [{ key, status, reason, evidence }]` and copy the report's `candidateKey` for each reviewed finding. Use `retained` for a justified finding or `fixed` after rework and rerun. A finding that is still present remains pending. Check text and symbol clearance on the reopened close-up.

Confirm the substitution scope under the project rules. Compare every pin's net, NC state, and footprint pad mapping with the original. After reopening, review the saved footprint, BOM and PCB attributes, and symbol display.

In both design and readback JSON, supply `substitutions: [{ ref, footprint, evidence, pins: [{ pin, pads }] }]`. Use full pin IDs and arrays of pad number strings. Use original evidence in the design and reopened evidence in the readback. Add `display` (`unchanged` or `changed`) and `displayEvidence` to each readback entry. Check BOM and PCB attributes in `components`. The script reports missing evidence, electrical mismatches, and display candidates separately.

Use a verified footprint identity that is comparable on both sides. When library and project UUIDs differ, compare footprint and pad geometry before assigning the same identity.

For standalone text deletion, put the target IDs in design `deletedTextIds`. Supply the complete reopened page TEXT ID list in readback `reopenedTexts: { pageId, ids, evidence }`. The check fails if a deleted ID returns.
