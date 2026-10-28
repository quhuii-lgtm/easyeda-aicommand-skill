---
name: ai-command-engine
description: Use local HTTP commands to query, draw, modify, and inspect EasyEDA Pro schematics, PCBs, projects, and libraries. Use extension-dev-skill for extension development and debugging.
---

# AI Command Engine

Skill documentation version: `2026.10.28`. This skill is installed and updated independently of the EDA extension and proxy. Their source and releases are in [the plugin repository](https://github.com/quhuii-lgtm/easyeda-aicommand); this skill lives in [its own repository](https://github.com/quhuii-lgtm/easyeda-aicommand-skill). Use the selected EDA instance’s `/help` for available commands.


Use this skill to operate EasyEDA Pro. See [Connection and setup](references/setup.md) for connection, instance selection, and parameter lookup. [简体中文](SKILL_ZH.md)

## v0.20.124 prepared package (not installed or host-accepted)

The v0.20.124 package is prepared. It has not been installed or accepted on an EDA host. The development-source fixes preserve pin, path, and coordinate-array order during task deduplication; release completed routing tasks from the running-task slot; and reuse the existing layer-name mapping for `routeTrack`, layer visibility, and layer locking. ID-set deduplication, duplicate-submission protection for unconfirmed tasks, and existing track readback remain. The existing layer-number path gained no all-layer enumeration or new limit. The v0.20.123 installed-package acceptance record below remains unchanged.

## v0.20.123 mixed rules and geometry combination (installed; bounded host results)

v0.20.123 is installed. Rules, import, and persistence passed bounded acceptance. An isolated DRC confirmed the later 20-pass functional path; the original fixture's isolated-net report is retained. Mixing both NET and NET_CLASS is supported only when each SAFE/TRACK reference and the unique SDK dual binding are confirmed. Explicit NET width takes precedence. Mixing does not add an exemption for historical deletions. `applyLayerWidthRules` defaults to `false`; when explicitly `true`, a missing structure base is allowed only with a complete known default-layer snapshot and exact complete copper-layer mapping. An explicit preferred width is written for every missing layer, and `from` explains that no base was supplied. Invalid or duplicate bases are still rejected or reported as unknown. Existing class base and precedence remain; NETs without a class are not supported. An existing default SAFE profile can work with a strict TRACK-only class structure and valid, independently confirmed NORMAL pad endpoint coverage. Slot holes still read the existing Slot Region → Track cell; mixed SAFE spacing inheritance is not supported. See [PCB topics](references/commands-pcb-special.md) for fields and limits.

Remaining source checks (2026-10-27): On EDA 4.1.78, the 178 unit values in two SAFE configurations and their units matched source; labels came from the SDK table returned in the same query. This does not establish general SAFE precedence, symmetry, parent behavior, or copper-layer coverage. Fixed FreeRouting 2.5.0 accepted DSN format in a headless output path but had no branch that generated DSN data; the prior observation of a zero-byte output and exit code 1 remains. Do not retry with altered parameters to pretend to fix it. An alternative is to save the PCB and re-export with `pcb.exportDsn`. The path was checked against a 9,864-byte file containing 10 new tracks and 2 vias, including positions, padstack diameters, and per-layer widths; maximum coordinate deviation was about 0.001 mil. This does not establish drill output or external DSN resaving. The old `autoRouteStart` range-help wording was corrected only in development source; runtime behavior was unchanged and the correction is not in installed v0.20.123's frozen package. Carry it into a later unified candidate; no separate upgrade is needed.

Native SAFE behavior follow-up (2026-10-27): In an independent ordinary top-layer different-net LINE sample on EDA 4.1.78, a 6 mil copper clearance produced no spacing error when both sides used defaults. When either or both sides were bound to 8.2 mil, native DRC required 8.2 mil. Native class-rule setup also writes SAFE bindings to member NETs. Setting one net back to default removed its SAFE field and the SDK returned `default`; although the class remained at 8.2 mil, a 6 mil target still produced no error, including after save/reopen. Therefore a missing NET SAFE field does not prove dynamic class inheritance. This result only constrains future implementation for this sample; the plugin adds no SAFE-spacing synthesis. The fixture still reports preset 3 mil clearance and four dangling wires; do not call the whole-board DRC passed.

Unrouted-path investigation (2026-10-27): The same 8,590-byte DSN retained all old copper, widths, and clearances. A controlled 20-pass run first reached 0 unrouted at pass 17; the former five-pass acceptance was insufficient, while the plugin default remains `maxPasses=50`. A new isolated copy retrieved the raw SES from a formal online 20-pass run; input/output CRCs matched. It added 10 LINEs and 2 VIAs; 3 ARCs and 89 protected segments were correctly resolved, and the original 191 data records remained. All 12 new geometries were independently checked. All 203 IDs and new data survived save/reopen; 199 data records matched, while four omitted display-default values. Two repeated imports added nothing.

The original functional geometry and rules were retained while only three old LINEs and one old ARC were reassigned to a diagnostic net; two NETs and two selectors were added. All 207 data records and IDs exactly survived save/reopen. On the isolated copy, DRC reported zero for +5V, the ACE_VIA functional net, 12 new objects, and functional pads; five diagnostic old-object findings remained. The original-net 20-pass copy still had nine DRC findings, so neither the original board nor the whole board passed DRC. The old five-pass result with 203 records remains. No route-loss or net-mapping defect was found; no code change or upgrade was needed. The temporary service exited and global configuration remained. The retained 20-pass result page is the copy with unchanged nets and 203 records. This result applies only to this input and does not guarantee 20-pass completion for arbitrary boards.

Bounded v0.20.123 host results (2026-10-27): Formal mixed-rule reading and conversion matched. Two bottom-layer width violations of 23/36 mil were rejected before writing, with 185 records unchanged. After two legal tracks, 187 records survived save/reopen (183 data records matched; four omitted display defaults); all IDs and both new track data remained, and two repeat imports added nothing. New tracks had `TrackError=0` and each had a pre-existing dangling `ConnectError`; whole-board DRC had 28 findings.

An isolated geometry-combination copy completed formal Start/Status/GetResult and explicit import of raw SES. Slot holes were 11.811 mil; four DEFAULT and eight CLASS conversions were retained. The 8,590-byte input and 5,584-byte output CRCs and raw SES bytes were independently checked. Three ARCs and 89 protected segments were correctly resolved. Nine tracks and three vias were added; all 12 new geometries were independently verified. The original 191 data records remained. All 203 data records and IDs survived save/reopen; two repeat imports added nothing; `task0`.

Whole-board connectivity did not pass on this sample: DRC had nine findings, including one `ConnectError` on the new +5V via. The raw SES contained only one track and one via near the bottom-layer pad, with no path to the top-layer pad. Router logs explicitly showed one unrouted item and four existing clearance findings. Evidence supports that import matched SES; the further cause of the unrouted route is unknown. `COMPLETED` means the task ended. Do not record this as whole-board routing or production acceptance.

The first online task completed after the connection and temporary service changed, but the SES was not retrieved; the interruption was retained. After confirming no board write occurred, the original task was complete, and the old process had exited, the workflow was completed with a new task ID. No uncertain write was resent. The temporary service exited; global configuration and the original 191-object design remained. For a missing base, local conversion and the locked JAR remain the evidence; native host export without a base was not claimed. Other established objective limits remain.

## v0.20.122 default-layer rules and rule sources (limited host acceptance passed)

With `applyLayerWidthRules:true`, v0.20.122 adds confirmed DEFAULT per-layer rules while retaining network-class precedence and atomic preflight. Strict SAFE history may select only a unique latest entity. NET_CLASS SAFE+TRACK can confirm TRACK only when the NET is explicitly bound to TRACK-only. v0.20.122 is installed and passed this bounded acceptance. Three real saved inputs, derived logs, and the actual JAR were checked; the historical branch has no native update log, and parent/copper-layer coverage still awaits reliable input. Formal reads and comparisons matched for four DEFAULT and two CLASS conversions; non-target source stayed unchanged. Rejecting 23/36 mil before writing left 183 records unchanged. Two legal tracks brought the count to 185; data and all IDs survived save/reopen; two repeated imports added nothing; `task0`. New tracks had `TrackError=0`; whole-board DRC had 26 findings and did not pass.

Online follow-up: In an isolated copy with no old tracks, v0.20.122 completed online Start/Status/GetResult and explicit raw SES import. It added nine tracks and four vias, all geometries independently checked. Two repeated imports added nothing. The 183 IDs and 13 new objects' data survived save/reopen (179 data records matched; four omitted display defaults); immediate and reopened DRC were both zero. The original 185 records remained, `task0`, and the temporary service exited with global configuration unchanged. This applies only to that sample; the 26 findings in the prior mixed fixture and other conditional limits remain.

## v0.20.121 NET SAFE and TRACK combination (limited host acceptance passed)

Adds independent interpretation of NET SAFE+TRACK widths for the verified shape. The plugin checks the SAFE reference, saved structure, and SDK dual binding, then reuses the existing per-layer TRACK checks. It does not interpret SAFE spacing or relax slot-hole compensation. v0.20.121 is installed: formal reads confirmed four-layer ACE_VIA scope, two bottom-layer DSN overrides, and per-net/per-layer comparison. Rejecting 23/36 mil before writing left 183 data records and IDs unchanged. After two legal tracks, 185 data records and all IDs survived save/reopen; two repeat imports added nothing; `task0`. Both new tracks had `TrackError=0` and each had an intentional dangling `ConnectError`; whole-board DRC had 26 findings and did not pass. See [PCB topics](references/commands-pcb-special.md).

## v0.20.120 thickness, per-layer rules, and DSN conversion (limited host acceptance passed)

EDA 4.1.78 has v0.20.120 installed and passed unified acceptance. The B4 source mil conversion and layer-order field were read and survived save/reopen. Mixed SES with both known violations and unknown explanations was rejected before writing; 181 data records and IDs were unchanged. Legal top 30 mil and bottom 15 mil tracks each added one LINE and no VIA. Two repeated imports added nothing; 183 data records and all IDs survived save/reopen; `task0`. Both new tracks had `TrackError=0` and preset unconnected reports; the whole board had 22 findings and did not pass.

The original 178-rule project remained read-only. `applyLayerWidthRules` defaults to `false`. Explicit `true` on formal DSN export changed +5V bottom width from 20 to 30 mil; four-layer net comparisons matched and were disclosed individually. The structure default 27.05 and EDA 27 mil still differed in the report; `routingConstraintsComplete` remains `false`. Complex selectors, manufacturing inputs, and other version limits remain. A later complete online round trip on an isolated copy with no old tracks added seven tracks and four vias from raw SES. Repeated import added nothing; save/reopen retained 177 matching data records, four omitted display defaults, all 181 IDs, and new geometries. Immediate and reopened DRC were zero. This applies only to that sample. See [PCB topics](references/commands-pcb-special.md).

## v0.20.119 explicit per-net layer widths (limited host acceptance passed)

Formal reads of four-layer rules and per-layer DSN differences passed in an independent EDA 4.1.78 project. Bottom 20/40 mil SES tracks were rejected before writing; 176 data records and IDs remained unchanged. Legal top 20 mil and bottom 30 mil each added one LINE and no VIA; geometry and nets were independently checked. Repeating the import before save and after close/reopen added nothing; all 178 data records and IDs remained; `task0`. The two new tracks had `TrackError=0`; whole-board DRC had 16 findings, including the original 14 and reports for two intentionally dangling tracks. Native DSN still did not express the 30 mil bottom default; this version reports the difference and does not rewrite DSN. Complex inheritance and real production boundaries remain.

## v0.20.119 pre-install candidate record (host results above)

Supports only the verified EDA 4.1.78, mil, NORMAL, simple explicit NET, and multi-row TRACK rule shape. Source layer IDs must be unique and fully map to SDK-enabled SIGNAL layers; rules, selectors, and SDK net/class bindings must agree. SES validation uses the actual layer's range. For networks with different per-layer DSN ranges, optional `layers` were added under `widthRuleComparison.nets` to report each layer; network status reflects a mismatch on any layer and does not use the first layer to represent the whole net. Existing single-row and equal-range reports remain. Sixteen related regressions, real-sample replay, and type checking passed; not yet installed. See [PCB topics](references/commands-pcb-special.md).

## v0.20.118 NET and NET_CLASS conflict comparison

In an independent sample, explicit NET TRACK selected ACE_POWER20 (5/20/100 mil), while its NET_CLASS was ACE_CLASS30 (25/30/35 mil). Source and SDK retained two separate bindings; DSN +5V width was 20 mil. Two +5V probes at 20/40 mil had `TrackError=0` on the first run and after save/reopen. In the same run, ACE_VIA probes at 20/40 mil each reported DEFAULT 22–38 mil, confirming the check actually ran. This sample supports explicit NET precedence over its class only. Do not extrapolate to non-empty parent or layer override behavior, or claim the 5/100 mil boundaries or interactive track-start default width were tested. No plugin change or new package was made. See [PCB topics](references/commands-pcb-special.md).

## v0.20.118 limited host acceptance (normal import, repeat import, persistence, and isolated target connectivity passed)

In an independent EDA 4.1.78 copy, the original complete SES imported normally: 12 LINEs and 2 VIAs were added, while 3 existing ARCs and 89 protected segments remained associated. Each new geometry passed independent checking. Reimport before save and after save/close/reopen returned `alreadyPresent:true`, `imported:false`, and `sesGeometryVerified:true`, with no additions. After reopen, 204 records and all IDs remained; 200 data records matched and four omitted display configurations were separately marked `true`; `task0`. This normal-import copy did not run DRC.

In another isolated copy, only three old copper islands were moved to a test net; target pads, tracks, vias, and original rules stayed unchanged. After save/reopen, one DRC run reported zero violations for the target +5V net and five target objects; the whole board still had eight findings on old objects and did not pass. This comparison supports that old same-net copper islands affected the previous connectivity report. The cause of the historical OOM remains unknown. See [PCB topics](references/commands-pcb-special.md).

## v0.20.118 pre-install candidate record (host results above)

The direct-append path of `pcb.importAutoRouteSes` re-enumerates all LINE IDs each time. If the current candidate, confirmed new tracks, or enumeration set changes, first verify the complete written prefix, original objects, and effective source, then update the new-ID set and continue. Final readback also verifies actual IDs, covering a collinear merge followed by T-junction splitting captured in this batch. Requirements for original objects, new VIA identity, geometry, and time budget remain. Related regressions, real-sequence replay, and type checking passed; host acceptance was pending. See [PCB topics](references/commands-pcb-special.md).

## v0.20.117 partial host acceptance (routing and persistence confirmed; command receipt failed)

All 12 tracks and 2 vias were created. After a T-junction split an earlier new track, the command still referenced the old ID and final source verification failed; there was no resend or compensating deletion. Independent source and SDK readback confirmed complete geometry and the original 190 data records. After save/close/reopen, 204 records remained, with all IDs and 200 data records preserved; four omitted display configurations were separately marked `true`. One DRC run returned 10 findings; one new +5V via still had a connection finding, so target connectivity did not pass. There were no ACE_VIA connection findings and no PN findings. The prior OOM cause remains unknown.

## v0.20.117 merge handling candidate for new tracks (host acceptance pending)

When the host merges and changes the ID of a LINE newly added in `pcb.importAutoRouteSes`, verify all tracks and vias written up to that point. Record the actual new track ID and continue only if complete geometry, net, layer, width, original objects, and effective source all pass. Continue to verify each new VIA by its individually confirmed ID. If anything is unconfirmed, stop later writes; do not resend, save automatically, or reopen automatically. See [PCB topics](references/commands-pcb-special.md).

## v0.20.116 limited host acceptance (repeat import and save/reopen passed)

The user approved one additional v0.20.116 import and bounded acceptance. On an independent EDA 4.1.78 bottom-layer project, importing the original v0.20.115 SES and original `routeBaseline` both before save and after close/reopen returned `alreadyPresent`, `imported:false`, and `sesGeometryVerified:true`. The 3 ARCs and 89 protected-segment associations remained. No new LINE or VIA was added; all 202 effective records and data remained; original export records were unchanged; `task0`. No DRC, old original PCB opening, or other EDA operation was performed this round. The v0.20.115 immediate 12 whole-board findings and historical DRC/open-original-PCB timeouts remain; their cause is unconfirmed and they are not resolved. See [PCB topics](references/commands-pcb-special.md).

## v0.20.116 pre-install candidate record (host results above)

After first import in v0.20.115, ARC header `ticket` values changed from 171/172/173 to 174/175/176 and stayed there after save, reopen, and user restart; `type`, `id`, and all `data` remained. v0.20.115 therefore incorrectly rejected repeat import, while source stayed unchanged after rejection. v0.20.116 ignores `ticket` only when comparing effective ARCs; both entry points share the same normalization. Other header fields and all data remain strict comparisons; `routeBaseline` is unchanged. Fourteen regressions, independent real replay, expert review, type check, and build passed. Independent replay covered four states from the actual installed v0.20.115; all matched three ARCs and 89 protected segments, repeat-import differences were 0/0, and nine classes of identity/data changes were rejected. Package details awaited entry by the primary agent. v0.20.116 had not been installed for host acceptance, and no approval had been given for another import. The current new connection `afd9fc17` was at the start page; no PCB or DRC was opened while the scope was assessed. See [PCB topics](references/commands-pcb-special.md).

## v0.20.115 limited host acceptance (first import and save/reopen passed; repeat import failed)

On EDA 4.1.78, the initial combined DSN/SES import succeeded: three existing ARCs and 89 protected segments were confirmed associated, nine LINEs and three VIAs were added, and original records remained. After save and reopen, all 202 design records remained with no observed data changes. Immediate whole-board DRC had 12 findings, including one on a new object (the +5V via was unconnected); there were no PN-branch object findings. Router service status was `COMPLETED` but still reported one unrouted item and four warnings, so the whole board did not pass. Repeat import was incorrectly rejected because an ARC header `ticket` changed; source was unchanged before and after rejection. The reopened DRC query timed out at 300 seconds; the result is unknown, not zero findings. After the user reported an unresponsive window and reopened it, a new connection `31d3482d` read back 202 data records and zero tasks. Later `project.open` and `getInfo` succeeded for the original project, but opening the original PCB timed out after 300 seconds and its original 190 records were not read again. The UI showed the project title and a blank workspace; real-time operations then stopped. The current connection `afd9fc17` remained at the start page; no PCB or DRC was opened. See [PCB topics](references/commands-pcb-special.md).

## v0.20.115 source and local acceptance record (candidate package frozen; host results above)

Before routing, `pcb.exportDsn` generated a `routeBaseline` for the DSN actually submitted; retain the original returned object. While the task mapping remains, `pcb.autoRouteGetResult` returns it. Pass that exact object to `pcb.importAutoRouteSes`; do not substitute a later re-export. Without the original object and an available task mapping, it is impossible to prove that ARCs stayed unchanged during the old task. Import preserves caller SES content and applies only the difference after verifying existing chains. ARC protected-chain matching is confirmed only in the batch-verified mil/1000 coordinates; even a 1 ULP difference after normalizing another unit may be conservatively rejected. Inch/mm without protected ARC chains and ordinary multi-path imports retain the prior path. Before writing, reject a wire with multiple paths mixing existing protected ARC chains and new tracks, to avoid missing extra paths; 19 rejection replays confirmed this boundary, while ordinary multi-path imports without protected ARCs retain the prior path. Expert review for P1 confirmed the rejection branch is closed with no actionable production-source issue. Replay covered three ARCs, 89 existing segments, and the expected nine LINEs/three VIAs; repeat-import difference was 0/0 and the complete reverse chain passed. Fourteen related regressions, standard type check, build, expert review, and package inspection passed. The candidate package was frozen; first-install and repeat-import outcomes are above.

## v0.20.114 limited host acceptance (branch passed; combined import failed)

Top and bottom OVAL/ARC branches were written and checked after save/reopen. New LINEs and original primitives remained; target DRC findings were zero, while whole-board DRC still had 15 findings. The same-source combined DSN/SES import failed: 89 existing ARC polyline segments were recognized as new. Fifty-three came from existing +5V ARCs and were 20 mil wide. Since their source association had not been confirmed, they were checked as new segments against the 25–35 mil rule and rejected before writing, with zero writes. R5 was repairing association/deduplication for full existing ARC polylines. The user approved one additional unified import acceptance after the fix. See [PCB topics](references/commands-pcb-special.md).

## v0.20.114 concentrated development candidate (source and local regressions passed; host acceptance pending)

Added branch starts from ordinary outer-layer OVAL capsule pads without holes, covering horizontal, vertical, rotated, and equal-width circle degeneration. Holes, offset shapes, and special layers are out of scope. Independent PADs use exact source data; EDA 4.1.78 getter dimensions accept exact values or an already evidenced nearest 0.1 projection and disclose the delta. Component PADs still use SDK-model precision checks; the stated precision boundary is unchanged.

Branch contact now supports verified real ARC endpoints. The existing `trunk` fields remain `primitiveId` and `endpoint`; no API field was added. An ARC is considered confirmed contact only when same-ID effective source matches a fresh `inspectArcReadback`; failures or unknown source remain unknown. Signed sweep angle is used for geometry; check actual contact and different-net clearance along the width-aware arc. Reject before writing if clearance is insufficient, the branch contacts then re-enters early, or there are multiple separate contacts. `arcContactResolution` reports source status. The old extension path remains conservative for unknowns; BranchContact extensions apply only to branch commands.

Source changes, local regressions, and v0.20.113 source preflight do not prove that v0.20.114's new branches passed on an EDA host. Host acceptance was pending; use one final package for the unified check.

## v0.20.113 limited host acceptance (2026-10-26)

v0.20.113 was installed. Formal reads found 13 effective physical layers. Original thickness and duplicate layer order remained explicitly unknown. Bounded acceptance completed for circle/RECT branches in an independent project, rejection of a known over-width SES, the following legal import, and same-source DSN/service/SES explicit import. Twelve tracks and three vias were added; after reopen, 203 records and complete SES geometry remained; target DRC for eight objects was zero immediately and after reopen. Whole-board DRC still had 10 findings and did not pass. Mixed violation and unknown branches passed local regressions only; the host normalized the controlled selector, so that counterexample was not established. Thickness conversion, complex inheritance, and actual production acceptance remain pending. See [PCB topics](references/commands-pcb-special.md).

## v0.20.111 no-net query host history (failed then; completed in v0.20.112)

The v0.20.111 `rangeinner A` no-net query returned an empty array and formally checked association on 8 of 20 faces; keep this as a historical failure. v0.20.112 completed bounded host acceptance; see [PCB topics](references/commands-pcb-special.md#020112-b2-empty-net-dsn-adaptation-host-acceptance-passed).

## v0.20.112 B2 no-net DSN adaptation (host acceptance passed)

Twelve formal checks across six projects covered 220 cumulative faces, including repeated checks after reopen. All 72 DSN-derived no-net faces were associated during this round. Manufacturing data was complete each time; source and rules were stable; `task0`. Save/reopen preserved geometry and manufacturing references. The original project was restored with 190/49 and `task0`. B2's R1–R6 scope was covered this round. Confirmed instance-source associations and text-origin limits, full source enumeration, and whole-board production acceptance boundaries remain. See [PCB topics](references/commands-pcb-special.md#020112-b2-empty-net-dsn-adaptation-host-acceptance-passed).

## v0.20.113 concentrated development candidate (source and regressions passed; host acceptance pending)

`pcb.checkManufacturingProfile` adds `physicalLayerEvidence`, retaining raw records and raw thickness. Uncertain units or conflicting order remain unknown; no fabricated `orderedLayers` are produced. For SES with both a definite violation and unknowns, status is `violation` and the operation is rejected before writing; both `unknowns` and `violations` remain. Pure-unknown semantics are unchanged. This is the pre-install v0.20.113 candidate record, not behavior of the then-installed v0.20.112.

## v0.20.110 remaining B2 functions (partially host-tested)

Checks were completed on the original project and isolated signed/closed/null copies. Across 14 projects and 28 save/reopen checks, 300 `geometry-correlated` faces and 60 closed faces remained consistent. On `rangeinner A`, eight faces with nets were associated on the first run; six PADs / 12 no-net faces were not associated, despite `manufacturing.complete=true`, `sourceStable=true`, and `rulesStable=true`. The original failed state was saved; cause remains unknown. The original project was restored with 190/49 and `task0`; B2 was not fully accepted.

## v0.20.109 B2 slots and dual-side openings (limited host acceptance passed)

v0.20.109 completed 12 formal checks across six projects on EDA 4.1.78, including save/reopen. Associations for 160 faces matched replay of actual data. Each read-only check preserved 190 effective design and 49 footprint records. Supported scope, additional getter notes, and uncovered cases are in [PCB shape and opening topics](references/commands-pcb-special.md#020109-b2-capsules-and-double-sided-solder-mask-openings-bounded-host-acceptance-passed). Do not claim full B2 or whole-board production acceptance.

## v0.20.108 JLCEDA string netlist path (limited host acceptance passed)

JLCEDA reads text directly through the verified file-generation path and preserves the original string return; other formats keep their original path, with no fallback after failure. The formal JLCEDA string call and save/reopen passed bounded v0.20.108 acceptance. See [Schematic workflow](references/commands-schematic.md).

## v0.20.107 display net changes and unconfirmed netlist results (limited host acceptance passed)

Display ordering is reported as the net change from the first pre-write state to the final snapshot. An unconfirmed result after a netlist call stops dependent macro steps. v0.20.106 reproduced the JLCEDA host hang, with root cause still unknown. v0.20.107's tested attributes, display report, and save/reopen passed; only simulation verified the netlist-failure partial branch. See [Schematic workflow](references/commands-schematic.md).

## v0.20.106 schematic feedback fixes (partially host-tested; reported defect retained)

Handle attribute modification, post-wire checks, and PNG/netlist stage diagnostics as described in [Schematic workflow](references/commands-schematic.md). Do not repeat an uncertain write. The v0.20.106 attribute and tested wire cases passed bounded host checks; the display-report defect and netlist hang were addressed or recorded later in v0.20.107.

## v0.20.105 ordinary circular SMD opening association (limited host acceptance passed)

Equal-diameter ELLIPSE supports the verified full-geometry solid-C opening; circle-diameter quantization was independently checked and the original RECT association remained. See [PCB topics](references/commands-pcb-special.md).

## v0.20.104 local bottom-layer SMD opening association (limited host acceptance passed)

Ordinary RECT SMD supports verified local copper layer 2. Source bottom expansion applies to the opposite component side; verify the actual PAD layer and complete manufacturing geometry. See [PCB topics](references/commands-pcb-special.md).

## v0.20.103 solder-mask expansion face mapping fix (limited host acceptance passed)

For ordinary SMDs on local copper layer 1, source top-side expansion follows the component copper side. This fixes a missed bottom-side opening association for asymmetric parameters. See [PCB topics](references/commands-pcb-special.md).

## v0.20.102 pad-opening geometry association (limited host acceptance passed)

The independent report connects stable footprints to actual pads, checks complete geometry of manufacturing openings, and links proven overlap witnesses. Geometry association does not mean unique source attribution. See [PCB topics](references/commands-pcb-special.md).

## v0.20.101 manufacturing-overlap contribution evidence (limited host acceptance passed)

The independent report adds an internal witness for confirmed silk/opening overlap and replays omitted contributions from manufacturing primitives on both sides. A manufacturing reference does not identify a unique EDA source. See [PCB topics](references/commands-pcb-special.md).

## v0.20.100 board-edge arc contribution evidence (limited host acceptance passed)

The independent report supports board-edge intersections of footprint arcs and contributions at the intersection from geometry-matched manufacturing primitives. Geometry association does not establish a unique source; original manufacturing decisions and candidate status remain. See [PCB topics](references/commands-pcb-special.md).

## v0.20.99 silkscreen candidate roles (limited host acceptance passed)

Manufacturing-location candidates are grouped by silkscreen source and possibly corresponding opening pads to locate them separately. A group with one candidate still does not prove actual participation or unique attribution; original decision and distance remain. See [PCB topics](references/commands-pcb-special.md).

## v0.20.98 board-edge position (limited host acceptance passed)

Board-edge distance reports add a representative witness location from the final manufacturing envelope; original distance and confirmation status remain. One witness does not represent every intersection or identify a unique source. Formal command and save/close/reopen passed: the right-edge witness matched independent geometry; nearby source candidates remained unconfirmed, and 190 design records were preserved. See [PCB topics](references/commands-pcb-special.md).

## v0.20.97 default-width adaptation (limited host acceptance passed)

v0.20.97 added default-width recognition for a verified structure: on EDA 4.1.78, when a net belongs to a class but its NET selector is completely empty and source, SDK membership, and rules agree, use global DEFAULT TRACK instead of misclassifying the class TRACK as inherited. Unknown or complex structures remain unknown. Formal command and save/reopen passed: DSN network widths 27/30 mil matched; SES at 20/40 mil was rejected before writing, then a legal 27 mil import passed. The original 174 records and new test tracks remained. See [PCB topics](references/commands-pcb-special.md).

## v0.20.96 source-location assistance (limited host acceptance passed)

Manufacturing areas add nearby source-object ID candidates, with explicit summary granularity and a status for cases that cannot be located. Locating does not modify manufacturing geometry, distance, or confirmation. Even one candidate does not prove a unique source. Formal command and save/close/reopen passed: four position frames had candidate counts of 1, 1, 2, and 1; the aggregate without a position frame explicitly could not be located; 190 design records remained. See [PCB topics](references/commands-pcb-special.md).

## v0.20.95 manufacturing checks (limited host acceptance passed)

The manufacturing path adds G75 circular-aperture arcs and a verified rotated RoundRect macro, using inner and outer envelopes to distinguish confirmed results from candidates needing review. Formal command and save/close/reopen passed: manufacturing parsing across five layers was complete with 25 arcs; 65 source paths and 95 segments remained; 190 design records and 49 footprint records were preserved. Full B2 did not pass. See [PCB topics](references/commands-pcb-special.md).

## v0.20.94 arc footprint silkscreen (limited host acceptance passed)

The source path adds ARC and mixed L/ARC paths, with quadrant extrema included in arc bounds. The formal command with 65 paths and 95 segments, plus save/close/reopen, passed. The 190 design records, 49 footprint records, and candidates remained. `points` are vertices; arc details are in `segments`. Nearby items remain unconfirmed, and full B2 did not pass. See [PCB topics](references/commands-pcb-special.md).

## v0.20.93 multi-segment footprint silkscreen (limited host acceptance passed)

Adds multi-segment, closed straight paths for top and bottom footprint silkscreen and fixes the bottom-side offset bounds in generic grouping. The formal EDA 4.1.78 command with 40 paths and 60 segments, and save/close/reopen, passed; 190 design records and 44 footprint records remained. Arcs and full B2 were not covered; rule inheritance remains unknown. See [PCB topics](references/commands-pcb-special.md).

## v0.20.92 project-library footprint source expansion (limited host acceptance passed)

The formal v0.20.92 command passed on EDA 4.1.78: exact supplemental reads from the current project library returned 30 straight segments across five components, matching verified manufacturing geometry in five orientations. After save, close, and reopen, 190 design records, source identities, segments, and candidates remained; records stayed unchanged during inspection; `task0`. Local layer 4, complex paths, and full B2 were not passed. Explicit single-net rules continued to read correctly in this version; inheritance from an empty selector remains unknown.

When the embedded document list lacks the footprint referenced by an actual component, `pcb.checkSilkscreen` now reads the current project library using the verified footprint UUID. The plugin itself verifies project-library identity, component reference, pose, and source identity, then reads again at the end. It distinguishes embedded-document and project-library sources; it does not fall back to personal, system, or public cloud libraries or override a discovered conflict. If readback is unclear, retain per-component uncovered notices; do not interpret an empty list as proof that no silkscreen exists.

Confirmed simple straight POLY paths on the local top silkscreen continue to calculate bounds by transforming endpoints and using half the line width. Complex paths, local bottom silkscreen, and complete enumeration remain uncovered. Nearby candidates still have `confirmed=false`; manufacturing output is reported separately and complete inspection remains `false`. v0.20.91's explicit single-net TRACK passed the 20/30 mil host comparison and pre-write rejection of an over-width SES; that result remains.

## v0.20.91 explicit single-net rule passed a bounded check; footprint enumeration failed

`pcb.checkSilkscreen` adds an independent check for straight-segment sources in footprints. The plugin reads embedded footprints in the current document and links actual components, footprint references, and poses. The first batch handles simple straight POLY on local top silkscreen; local bottom silkscreen, complex paths, and unknown sources are individually reported as uncovered. Footprint-source identity retains component ID, footprint UUID, and local primitive ID; these are not represented as board-level SDK primitive IDs. Nearby items remain unconfirmed candidates; manufacturing output is reported separately and complete inspection remains `false`.

Line transforms were checked segment by segment against official Gerber using five isolated-footprint placements, including 37° on the bottom side; actual geometry persisted after save/reopen. The bottom side is mirrored in local Y first, then rotated and translated; the generic grouping bounding-box function is unchanged. The installed package's embedded-footprint list was actually empty, so it returned no 30 silkscreen segments. The five components were correctly reported as uncovered; B2 did not pass.

A simple TRACK rule can be confirmed when a net belongs to a class but has an explicit selection of its own, provided the EDA 4.1.78 structure is confirmed and source, SDK class membership, and rule values agree. Inheritance from empty selectors, complex selectors, conflicts, or insufficient source remains unknown. The plugin checks rules itself; callers do not need to supply rules that are already readable. DSN, SES, and manufacturing-parameter checks use this same parser. A width within the allowed range but different from preferred is not a violation. DSN default-width differences are reported separately; `routingConstraintsComplete` remains `false`.

## v0.20.90 order calculation sets and SES diagnostics (limited installed-package acceptance passed)

v0.20.90 passed bounded installed-package acceptance on EDA 4.1.78: an extra order impedance calculation ID was correctly listed as a mismatch while unverified status remained; SES reported the specific reason when the net class was unknown; 10 tracks and 4 vias matched the original geometry, with immediate and save/reopen DRC at zero. Unknown rules remained unknown. A B5 component-pad isolation sample also passed immediate and reopened target-DRC checks; all 311 geometries and nets remained, while four display-default representation changes were listed separately. The whole board still had 25 pre-existing findings. Footprint silkscreen coordinate mapping and net-class inheritance parsing were not fixed by this release.

v0.20.86 verified adaptation of a new net's default records on EDA 4.1.78. When creating a PAD, the host may also generate the net's default NET and rule records. The plugin accepts only two records exactly matching this request and confirmed default values; other primitives and existing rules must remain unchanged. No pre-created net is required. New-net creation for ordinary SMDs and save/reopen passed; branches for new nets with copper holes and some solder-mask cases passed local regressions only. The ordinary SMD new-net comparison had no native DRC connectivity or clearance errors. Old through-hole and component shapes have not passed native connectivity acceptance.

v0.20.85 `pcb.routePadBranches` passed bounded acceptance on EDA 4.1.78 for three write groups, source geometry, and save/reopen. Independent PADs retained four-decimal start points, through-hole prefix, and shared suffix; component PADs used the SDK global model. Native DRC still reported connectivity errors for some local objects, so electrical connectivity did not pass. See [PCB topics](references/commands-pcb-special.md).

v0.20.83 passed bounded host acceptance of real-arc serpentine routing on EDA 4.1.78, including save/close/reopen. Single-U and double-U cases passed. In the double-U case, the host automatically split an old bypass; both segments were confirmed deleted and the tail remained. Explicitly provide radius, length tolerance, and self-spacing when these cannot be reliably mapped from project rules. Whole-board connectivity, impedance, and production did not pass. See [PCB topics](references/commands-pcb-special.md).

v0.20.82 is an uninstalled compatibility candidate for reading arc endpoints. v0.20.81 host testing found a false failure on the second arc and stopped; do not claim arc extension passed. Source retained correct four-decimal endpoints and a -90° sweep. Batched SDK objects display only one decimal; a fresh-getter difference awaits read-only diagnosis. See [PCB topics](references/commands-pcb-special.md).

v0.20.81 changed `pcb.tuneLength` to a real-arc serpentine candidate; the installed build awaited acceptance. It uses tangent LINE/ARC segments and accumulates actual arc length. It adds explicit `bendRadius`; when no reliable rule mapping exists, radius, length tolerance, and self-spacing must be supplied. v0.20.80 tested only the older triangular polyline and does not count as arc-style acceptance. See [PCB topics](references/commands-pcb-special.md).

v0.20.80 `pcb.tuneLength` passed bounded geometric acceptance on EDA 4.1.78 for local replacement of a single segment and multi-segment chain, including save/close/reopen. Total-length tolerance and serpentine self-spacing are explicit; do not use the differential-pair default of 10 mil. Native DRC still had a connection error on the test open chain; this does not establish electrical connectivity, impedance, or whole-board acceptance. See [PCB topics](references/commands-pcb-special.md).

v0.20.79 `pcb.routeDiffPair` passed bounded host acceptance on EDA 4.1.78 for straight and specified 45-degree paths, including save/close/reopen. The original 194 records remained and six new LINEs persisted. Readback tolerance was 0.001 mil; four-decimal host source can cause a small gap difference, so actual gap is not guaranteed to equal the request exactly. Serpentine compensation, repeated-pin branches, whole-board connectivity, and impedance remain unverified. See [PCB topics](references/commands-pcb-special.md).

v0.20.78's trace-width configuration read fix passed bounded host acceptance on EDA 4.1.78. B4 correctly read +5V preferred width of 20 mil and ACE_VIA preferred width of 10 mil. Disabled SIGNAL layers and a recognized independent length-tolerance configuration no longer caused two kinds of false reports. Preferred width, min/max, unknown nets, and unverified calculation comparisons passed. B4, DSN, and SES share this parser; no separate DSN/SES host acceptance was performed this round, and project rules or routing were not changed.

v0.20.77's source-address compatibility fix passed on EDA 4.1.78 using the same failing sample. Copper-layer count, declared-record differences, invalid input, and wrong-target rejection also passed bounded host acceptance. The width-comparison branch was not yet accepted then; v0.20.78 later completed its bounded host checks. B4 physical parameters and a real order were still not fully confirmed.

Historical v0.20.76 added `pcb.checkManufacturingProfile`, a read-only comparison of the same named manufacturing parameters, current copper-layer count, net width rules, and caller-provided order-confirmation records. The first installed build failed source validation and did not pass host acceptance. It does not automatically change rules, calculate impedance, or modify an order.

v0.20.75 passed bounded manufacturing-output acceptance for silkscreen in an independent EDA 4.1.78 project. Near-pad, moved-away, opposite-side, board-edge clearance, text outside the board, and save/close/reopen cases passed. This does not cover all silk objects colliding in the original design or whole-board production acceptance. The v0.20.74 raw-thickness receipt also passed bounded host acceptance.

Historical v0.20.74 introduced manufacturing-layer checks for silkscreen. v0.20.75 later fixed a false report caused by source representation and passed bounded host acceptance, as described above.

v0.20.73 was a candidate for corner-unit conversion and complete writes of partial extensions. Public `cornerRadius` remains in mil and is converted to the SDK representation for the currently verified host. When only some extension fields are supplied, read the new pad's effective defaults at that time, merge the supplied fields, and save all fields explicitly. This does not make them follow future board-wide rules. Isolated SDK testing and formal commands on installed v0.20.73 passed bounded save/reopen and manufacturing-output acceptance. See the PCB command documentation for scope.

## Historical v0.20.72 hole and pad issues

Nonzero rectangular corner radius had a unit-mapping error: public `cornerRadius` is declared in mil, while the current host SDK treats the fourth value as a percentage of half the shorter side. Matching source/getter values do not prove the manufacturing radius is correct. The v0.20.73 candidate includes the conversion, pending formal host retest; separate findings for zero radius and circular pads are unaffected.

When only some `solderMaskAndPasteMaskExpansion` fields are specified, omitted `null` values become 0 after save/reopen and cannot be called reliable inheritance. Until repair is verified, use either a fully omitted expansion object or the verified pattern with all four fields. Do not treat immediate readback of a partial object as persistence acceptance. The proposed approach reads effective defaults on the new pad, merges requested fields, then saves a complete object; this fixes creation-time values, so those fields will not automatically follow future board-rule changes. The isolated test of this approach has passed; the formal v0.20.73 candidate still awaited host acceptance.

v0.20.72 was a candidate for hole/pad readback compatibility. It added the rectangular source `radius` field. Only PAD coordinates and round-pad width/height tolerate the getter's one-decimal representation; complete source geometry must still exactly match the request. Successful receipts retain actual read values and differences. This does not quantize input to a 0.1 mil grid or expand tolerance for hole diameter, offset, angle, or solder-mask values. Local checks still require an installed-build retest.

v0.20.71 covered B1 designator text properties, B2 nearby silkscreen bounding-box prechecks, and B3 holes and independent pad candidates. B1 and B2 passed bounded host and save/reopen checks in v0.20.71; B2 does not mean full silkscreen DRC. B3 still had two false reports awaiting a later candidate fix. Query the current window's help before use. See [PCB workflow](references/commands-pcb.md).

v0.20.70 was a B8 document-target-check candidate. If the optional `__docUuid` is supplied to a page-level command, it must be a non-empty, non-whitespace string exactly matching the current document UUID; if omitted, operate on the currently identified page. Type mismatch, identity mismatch, or failed readback errors before the handler starts; the command does not implicitly activate another page. Entry read and initial handler wait share the existing `_timeoutMs`; progress-heartbeat extension remains, with no persistent lock. Help lists the optional parameter. Four related regressions, full-project type check, and review by the same senior expert passed. On installed EDA 4.1.78, six groups covering invalid parameters, wrong type, wrong UUID of same type, rejection of same-type page switches between macro steps, and subsequent normal reads passed; schematic and PCB non-DOCHEAD records remained. This does not promise atomic binding across arbitrary `await`s. On EDA 4.1.78 / SDK 0.4.26, B7 found no reliable grid-reading path: after the user changed to 0.1 inch, source still had no grid field, so no `getGrid` command was added.

## v0.20.69 automatic-routing rule checks (candidate; bounded installed-package acceptance passed)

`pcb.autoRouteStart.automaticNeckdown` accepts booleans only and defaults to `false`; the receipt's `routingSettings` reports the value submitted, not server readback or verified local neckdown behavior. `pcb.exportDsn` and the start receipt add `widthRuleComparison` to distinguish EDA minimum/preferred/maximum widths from DSN structural defaults and effective net widths; DSN is not rewritten. `pcb.importAutoRouteSes` checks confirmed min/max rules only for new segments and returns `widthRuleCompliance`; a preferred-width deviation within the allowed range is not a violation. Unknown rules are reported explicitly and the existing import path continues, with geometry readback checked independently and strictly. Eight regressions, type checking, and expert review passed. The installed package passed EDA 4.1.78 acceptance on two 10-track/4-via SES cases and save/close/reopen, with immediate and reopened DRC both zero. Real service readback confirmed the default `false` and explicit `true`; two over-limit inputs were rejected before writing without persistent locking. The host omitted `display:true` for four category display settings while geometry records remained; UI display equivalence was not separately verified. No neckdown geometry difference was triggered. NET_CLASS inheritance, complex selectors, and unconfirmed layer rules are not covered; `routingConstraintsComplete` remains `false`.

## v0.20.68 post-via refresh native-field mapping fix

The v0.20.67 host test did not select the connected track; the target connectivity errors remained and acceptance failed. LINE source uses `netName/layerId/width`; SDK getters use `Net/Layer/LineWidth`. Use layers only when `layerStatus` is 1 (visible) or 2 (hidden); do not select status 0 or unknown. Regressions using actual host LINE and layer data plus synthetic boundary cases, five main regressions, type check, and expert review passed. A clean two-layer EDA 4.1.78 sample passed: draw two top-layer and four bottom-layer 10.05 mil tracks, then place a 24/12 mil through-hole via. The original `modify` return object and ID, getter, and source were all checked for both connected LINEs. The two target +5V connectivity errors disappeared before save and remained zero after save/close/reopen; six tracks, one via, and all non-DOCHEAD records remained. Two unconnected pads on another net remained; this is not whole-board DRC zero. The result covers only the tested ordinary LINE endpoint shape; the command still returns `connectivityVerified:false`. Other endpoints and original return/source-preservation checks remain unchanged; testing in the new A1 environment remains deferred.

## v0.20.67 same-endpoint refresh after adding a via (candidate)

For an ordinary LINE selected before `pcb.placeVia`, on the same net and enabled SIGNAL copper layer, whose endpoint actually meets the new via, serialize the existing four-endpoint-value modification and independently verify the raw return, ID, attributes, and full source. Do not delete and rebuild the line. If safe preselection is unavailable, disclose why the refresh was skipped and retain the existing via-placement path. Once refresh starts, an unknown result returns a single error and stops; do not retry or automatically restore. The receipt adds `endpointRefresh`; `connectivityVerified` remains `false`. Do not automatically run DRC, save, or reopen. Five related regressions, type checking, and expert review passed; installed-build immediate connectivity and save/reopen were pending. The A1 test remains deferred per user decision.

## v0.20.66 precise manual SES append import

The precise manual SES append path passed on a four-layer EDA 4.1.78 sample. It is enabled only on the append + direct-primitives path: after creating and reading back each new via, request a ratsnest calculation once; create new tracks only after all succeed. Acceptance of the request does not verify connectivity. On failure, stop later steps; do not retry automatically or switch backends. Six SES regressions, type check, and expert review passed. One import retained 10 tracks and four 24/12 mil vias with original coordinates and 10.05/7.536 mil widths. Immediate DRC before save was zero; after save/close/reopen all non-DOCHEAD records remained and DRC was still zero. Via hole diameter must be supplied explicitly. This does not cover native precision or generic post-via repair.

## v0.20.65 false-positive floating-point via readback fix (candidate)

`pcb.placeVia` tolerates only machine floating-point round-trip error in coordinates, hole diameter, and outer diameter, capped at 1e-9 mil. ID, net, and through-hole type remain strict. A real geometric mismatch still returns one error; do not create a replacement, delete anything, or leave a persistent lock. Four related regressions, type checking, and expert review passed. The original 962.648 failure sample created and read back correctly on EDA 4.1.78. The same four-layer workflow placed four vias, requested ratsnest once per via, then drew 10 tracks; immediate and save/close/reopen DRC were zero and all original geometry remained. This result covers only the separate-command workflow, not SES import or generic post-via repair.

## v0.20.64 exact SES import with explicit hole diameters

This passed on a four-layer EDA 4.1.78 sample: 10 tracks and four vias retained high-precision coordinates, 10.05/7.536 mil widths, and the caller-specified 12 mil hole diameter after save/close/reopen. Immediate DRC had seven connectivity findings; reopened DRC had zero, but the immediate connectivity anomaly was not resolved. `sesGeometryVerified:true` does not mean immediate connectivity DRC passed. A caller may provide `viaHoleDiametersMil` to manual `pcb.importAutoRouteSes`, explicitly specifying the through-hole padstack drill diameter and selecting the precise primitive backend. If omitted, the original backend selection remains; native import has known precision limits. Do not infer hole diameter from copper outer diameter or switch backend after a write failure.

## v0.20.63 multi-layer mapping

Native writes passed on EDA 4.1.78 for a four-layer SES sample explicitly on a 0.1 mil grid with 10 mil width: 10 tracks and four vias passed strict readback and save/close/reopen; DRC was zero. Native import rounded the original high-precision coordinates to the 0.1 mil grid. At that grid, 10.05/7.536 mil widths both became 10 mil, failed strict validation, and were not automatically restored. This does not apply to the already-passed precision sample using direct primitives. Hole diameter still cannot be inferred from SES copper outer diameter.

## v0.20.62 named red-solid two-segment T-junction

The named red-solid two-segment polyline T-junction passed on EDA 4.1.78 through command success, source and model readback, and save/close/reopen. The same page's independent-region sequence of saving/reopening the polyline before adding a T also passed, with the connected state retained on another save/reopen. The host once rejected the first wire on a new page; initialization cause is unconfirmed, so other untested shapes are not accepted by that result. The fix adjusts multi-segment-wire readback and a shared timeout budget only for the observed named T-junction; other wiring success criteria are unchanged. For unknown results, stop dependent writes and inspect the current state. v0.20.61 stage diagnostics caught a first validation failure in a bounded installed sample, but the T-junction write still failed. v0.20.60 slot-hole export compensation passed bounded save/close/reopen and DSN byte-consistency checks; this does not establish full routing or DRC acceptance. Use `/connections` and `/help` from the target window for the actual version.

`pcb.checkManufacturingProfile` now returns each impedance calculation ID found only in the caller's order-confirmation records as a separate `order.calculation.<id>` mismatch. Calculation IDs must correspond. Extra order calculations are not silently ignored. The command does not modify the order or profile and does not change verified/unverified status of calculation evidence. Missing physical stackup, Dk, and real-order information remain unknown within the original scope.

`pcb.importAutoRouteSes.widthRuleCompliance.unknowns` remains an array of strings and now explains the net, layer, and locatable reason for each track. Status and violation criteria are unchanged. Unknown rules do not become passing, and no persistent lock was added. NET_CLASS inheritance and empty-selector relationships remain unconfirmed; do not guess precedence.

B5 also completed a net-scope comparison under the same import conditions. The unchanged copy reproduced three target connection findings for one via and two SMDs. In an isolated copy changing only network membership, target findings were zero immediately and after save/reopen. Geometry remained; four category display-default representation changes were listed separately. This supports an association between the previous report and same-net external scope. Whole-board DRC still had 24 old findings. The component-PAD dual-end comparison later passed after save/reopen on a separate copy; this does not establish general connectivity or whole-board acceptance.

## v0.20.89 silkscreen polyline candidate adaptation (limited host acceptance passed)

v0.20.89 passed bounded host and save/close/reopen acceptance on EDA 4.1.78 for three actual POLYs. One top- and one bottom-side text-neighbor candidate remained unconfirmed; distant objects, opposite-side objects, and copper tracks were excluded. The 178 design records stayed unchanged during inspection. Geometry remained after reopen; four omitted display defaults and a missing default-length rule for an empty net were listed separately. A curved POLY later passed a separate bounded comparison. This acceptance does not prove complete footprint enumeration or precise ink collision.

A real EDA 4.1.78 silkscreen test line was stored as POLY and did not appear in ordinary Line enumeration. `pcb.checkSilkscreen` adds SDK Polyline whole-bounds candidates for same-side text, designators, other silkscreen, and pads; it does not split the path. If SDK returns silk Line/Arc objects, they remain supplemental checks.

Return type adds `silk-polyline`; coverage adds `checkedSilkPolylineCount` and `unsupportedSilkPolylineCount`. Source mapping and complete enumeration remain unverified. Candidate `confirmed` and overall `complete` remain `false`. Copper layers and opposite-side items are excluded; manufacturing output is checked separately. v0.20.88 had only Line/Arc inputs and missed the actual POLY in this sample, so it cannot be considered acceptance of silkscreen-stroke coverage.

## v0.20.88 silkscreen straight-line and arc candidates (historical candidate; actual POLY coverage failed)

`pcb.checkSilkscreen` retains its inputs. SDK-enumerated straight lines and arcs on top and bottom silkscreen are included as bounding-box candidates and compared with same-side text, designators, lines, arcs, and pads; copper layers and opposite-side objects are excluded. If the API, valid ID, layer, or bounding box is missing, list the object as unsupported.

Returned `silk-line` and `silk-arc` may come from footprints; complete enumeration and source mapping are unproven. Nearby or overlapping bounds only mean review is needed. `confirmed` and `complete` remain `false`; this does not prove actual glyph or ink collision, or full silkscreen DRC. Manufacturing-output checks remain separate.

## v0.20.87 same-source-copy import acceptance follow-up (2026-10-23)

In an independent same-source four-layer EDA 4.1.78 copy, explicit SES import, immediate DRC, and save/close/reopen completed. Ten new tracks and four 24/12 mil vias matched each segment of retrieved raw SES within 0.001 mil. Immediate and reopened DRC were both zero. The original 170 data records remained after import; after reopen, 184 records remained, with only four omitted `display:true` category settings and all other data and headers unchanged. Display equivalence was not separately tested. Effective net-class width rules still reported unknown, so rule checking did not pass. This does not guarantee routing or production acceptance for arbitrary PCBs.

`pcb.autoRouteGetResult` passed bounded read-only readback acceptance on EDA 4.1.78. External tasks and plugin-started tasks correctly reported unknown/known original-document binding, respectively. File and service output matched byte for byte across repeated retrievals; the original 305 records remained. It does not automatically import, clear tracks, save, or merge short segments. Complete import, DRC, and save/reopen are outside this result.

v0.20.57 removed the persistent write and SES-document locks caused by historical failures; the companion proxy and extension must be updated together. Single-command errors and stopping dependent steps in the current macro remain. Later independent commands no longer require manual unlocking. The request FIFO covers only each request/response cycle; timeout does not cancel the underlying SDK operation. Earlier pause and version restrictions remain.

v0.20.56 retained TEXT deletion execution while updating only help and known-issue notes; execution code carries over v0.20.55. TEXT deletion persistence was a known failure on EDA 4.1.78 in an independent sample. Do not treat immediate success as final deletion.

v0.20.55 was a candidate fix for the default line type on T-junctions. In the narrow adaptation, default line-type verification now expects the host-confirmed `null` and does not accept missing or throwing reads. On EDA 4.1.78, the default line, collinear extension, and vertical branch into a horizontal line's interior passed save/reopen; recoloring a red dashed net and changing the default type to DOT also passed. TEXT deletion succeeded immediately but returned after reopen, a known persistence failure; the user chose to retain TEXT deletion with help documenting the current-version issue rather than disable it. Other merge shapes and functions were not thereby accepted.

v0.20.54 was an unnamed T-junction adaptation candidate. It covers only evidenced default empty style, a vertical branch into the interior of one horizontal line, retaining the same WIRE, and rebuilding an automatic empty NET label. Named lines, multi-segment lines, and multi-WIRE merges were outside the added scope. Host T-junction still falsely reported `partial`; the fixture had filled missing values with zero and masked the default-`null` difference.

v0.20.53 was a candidate focused on real-use feedback. On EDA 4.1.78 retest, the ordinary default line and collinear extension passed immediately, but an unnamed T-junction still returned `partial` because properties were reordered; overall acceptance failed. Use the target window's help for new behavior. Local regressions do not replace save/reopen, netlist, or drawing checks. If a result is unknown, inspect the current state first; do not blindly resend. The new version no longer requires manual unlocking.

## v0.20.51 local acceptance build

v0.20.51 corrected `schematic.connectPin` coordinate precision and `pcb.listPours` fill status. Five pin-connection cases and filled/unfilled copper-area samples passed save/reopen checks on EDA 4.1.78. This limited result does not establish whole-design DRC or acceptance of other interfaces; the build was not publicly released. The Chinese menu entry is “AI 指令引擎” (“AI Command Engine”) and includes “指令列表…” (“Command List…”) and bridge operations. Command names and JSON parameters are unchanged. The 14 features paused on EDA 4.1.78 remain rejected as described in version notes.
## Operating boundaries

- Inspect the current state first and confirm the user's goal and allowed scope.
- Back up before destructive operations. Only one writer may operate on a window at a time.
- If a write result is unknown, stop relying on it and read back the current state before proceeding. Do not blindly resend.
- At each stage, check save state and untouched content. Command success, a screenshot, or zero DRC errors alone does not prove the design is acceptable.
- Commands unsupported by EDA 4.1.78 are listed in [PCB low-frequency commands](references/commands-pcb-low.md#eda-version-restrictions) and [schematic low-frequency commands](references/commands-schematic-low.md#eda-version-limitations). They require EDA 4.2 or later; EDA 4.2 has not been accepted on a real host.

## Choose files by task

Read only the files needed for the current task. For state or command-help queries, do not read drawing workflows. Before writing to a schematic or PCB, read the relevant drawing requirements, command table, and operating workflow. Drawing requirements define quality; command tables help select commands; workflows define execution order, readback, and saving. Read low-frequency and topic-specific pages only when needed. Use `/help?cmd=<command-name>` for parameters from the target window version.

| Task or timing | File |
| --- | --- |
| First connection, window selection, coordinate units, or activating a document | [Connection and setup](references/setup.md) |
| Manufacturing exports, BOM, and coordinate formats | [Production file requirements](references/生产文件操作要求.md) |
| Find commands by category and recommended frequency | [Command frequency](references/commands-frequency.md) |
| Draw or modify a schematic: drawing quality | [Schematic operating requirements](references/原理图操作要求.md) |
| Common and specialized schematic commands | [High-frequency](references/commands-schematic-high.md), [low-frequency](references/commands-schematic-low.md) |
| Before schematic writes: order, readback, saving, and full component replacement | [Schematic workflow](references/commands-schematic.md) |
| Draw or modify a PCB: placement, routing, copper, and manufacturing requirements | [PCB operating requirements](references/PCB操作要求.md) |
| Common and specialized PCB commands | [High-frequency](references/commands-pcb-high.md), [low-frequency](references/commands-pcb-low.md) |
| Before PCB writes: order, readback, saving, and autorouting | [PCB workflow](references/commands-pcb.md) |
| Fanout, geometry, DFM, nets, or manufacturing export | [PCB topics](references/commands-pcb-special.md) |
| Create, open, or manage projects, boards, or schematic pages | [Project and page commands](references/commands-project.md) |
| Query, create, or maintain symbols, footprints, or devices | [Library commands](references/commands-lib.md) |
| Query design rules, estimate trace width, or search SMT parts | [Knowledge and parts commands](references/commands-knowledge.md) |
| Attribute, label, netlist, save, or recovery problems | [Troubleshooting](references/pitfalls.md) |
| Plugin error evidence and issue reporting | [Issue reporting](references/issue-reporting.md) |
| Develop, modify, or review plugin commands | [Plugin development requirements](references/插件开发要求.md); use extension-dev-skill for extension APIs and live debugging |
