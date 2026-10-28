# PCB Geometry Commands

## 0.20.123 Mixed Rules and Geometry Combination (Installed; Bounded Host Results)

Version 0.20.123 is installed. Rules, import, and persistence passed bounded acceptance; the later 20-pass functional path was confirmed by isolated DRC, while the original fixture's isolated-net report is retained. NET + NET_CLASS mixing is supported only when each SAFE/TRACK reference and the unique SDK dual binding are confirmed. Explicit NET width takes precedence. Mixing does not add an exemption for historical deletions. `applyLayerWidthRules` defaults to `false`. With it explicitly set to `true`, a missing structure base is allowed only with a complete known default-layer snapshot and exact, complete copper-layer mapping; an explicit preferred width is written for every missing layer, and `from` states that no base was supplied. Invalid or duplicate bases are still rejected or reported as unknown. Existing class bases and precedence are retained. NETs without a class are not supported. An existing default SAFE profile is compatible with a strict TRACK-only class structure and valid, independently confirmed NORMAL pad endpoint coverage. Slot holes still read the existing Slot Region → Track cell; mixed SAFE spacing inheritance is not supported.

For mixed NET and CLASS rules, check each SAFE reference, TRACK reference, unique SDK row, class membership, and source separately. Empty/default NET selectors, parents, copper-layer coverage, conflicts, and unresolved deletions remain unknown. A real-host comparison for a same-name SAFE completed save/reopen checks on 185 objects, with reported widths matching the control. Different-name SAFE results are regression evidence only; they do not establish different-name host acceptance.

When the base is missing, every signal layer must have an explicit width. Keep an existing identical layer override; reject conflicts, duplicates, or missing mappings, and emit output only after all prechecks pass. DEFAULT comparison is confirmed only when the base is truly missing and every layer is covered. A pre-existing invalid base cannot be masked by layer overrides. CLASS still uses its own base and `layer_rule`.

The slot-hole path jointly checks source NET-class membership, unique NET/CLASS selectors, and the single-level SDK nesting relationship. CLASS must have TRACK only; NET must be empty or have TRACK only; all SAFE values must be default; `parent` must be empty with no copper-layer coverage. Network endpoints are covered only by a valid `PAD_NET` or a confirmed independent NORMAL PAD association; they are not inferred from NET declarations, LINEs, or ARCs. Existing default SAFE labels, units, and cell values are retained. OVAL contours and ARC geometry are checked separately by the existing workflow.

Native multi-ticket SAFE history, parent/copper-layer coverage, real production data, unique text-source evidence, external DSN resaving, and historical OOM/PNG reproduction conditions remain as before. A build or local replay does not replace commands, save/reopen, and target DRC after candidate installation.

Remaining source verification (2026-10-27): Across two SAFE configurations in EDA 4.1.78, all 178 cell values and units match the source; labels come from the SDK table captured in the same run. This does not prove general SAFE precedence, symmetry, parent behavior, or copper-layer coverage. The fixed FreeRouting 2.5.0 headless output path accepts the DSN format but has no branch that generates DSN data; the existing observation of 0 bytes / exit code 1 is retained. Do not retry with different parameters as if that fixed the issue. An available alternative is to save the PCB and re-export with `pcb.exportDsn`. The 9,864-byte file from that path was checked for the positions, padstack diameters, and layer widths of 10 new tracks and 2 vias; maximum coordinate deviation was about 0.001 mil. This does not prove drill output or external DSN resaving. The old `autoRouteStart` help text describing the scope was corrected in development source only. Runtime logic was not changed, and the correction is not in the frozen installed 0.20.123 package; include it in a later unified candidate, with no separate upgrade needed.

Supplemental native SAFE behavior (2026-10-27): In an independent ordinary top-layer, different-net LINE sample on EDA 4.1.78, 6 mil copper clearance produces no spacing error when both sides are default. When either side or both sides are bound to 8.2 mil, native DRC explicitly requires 8.2 mil. Native class-rule setup also writes SAFE bindings to member NETs. Setting one NET back to default deletes its SAFE field; the SDK returns `default`. Even while the class remains at 8.2 mil, the target 6 mil still produces no error, and this persists after save/reopen. Therefore, a missing NET SAFE cannot be used to infer dynamic class inheritance. This result constrains future implementation for this sample only; the current plugin does not synthesize SAFE spacing. The fixture still reports a preset 3 mil spacing issue and four floating tracks; do not call the whole-board DRC passed.

SAFE mapping applies only to this stable snapshot of the same board: 13 row labels and 12 column labels, with 89 existing cells in each table. `source.columnNames` is empty, so indices alone cannot be used to infer other versions. `source.isForAll=ALL` and SDK table `key1` / source row `layerId1` are both retained; this is not interpreted as applying only to the physical top layer. Slot Region → Track is `[8][0]`, 11.811 mil. The SDK type remains `Record<string,any>`; arbitrary matrices and mixed SAFE inheritance are not enabled based on it.

The host re-exported DSN comes from a saved PCB with 203 objects and retains all sources and rules. It proves only the geometry and widths in that export snapshot. It does not replace router-side DSN serialization, and file existence does not prove connectivity or production acceptance. If an external implementation adds native DSN output, layer-width fidelity must be checked separately. No JAR was replaced and no dependency was added in this round.

Later unrouted-path investigation (2026-10-27): The same 8,590-byte DSN retained all old copper, widths, and clearances; in a controlled 20-pass run, the first `0 unrouted` result occurred on pass 17. The original acceptance limit of `maxPasses=5` was insufficient; the plugin default of `maxPasses=50` remains. A new isolated copy used the official online 20-pass flow to retrieve the raw SES. Input/output CRC checks passed; 10 LINEs and 2 VIAs were added, and 3 ARCs / 89 protected segments were resolved exactly. The original 191 `data` entries remained. All 12 added geometries were independently checked and correct. All 203 IDs and the added `data` persisted after save/reopen; 199 `data` entries were identical and four omitted default display values. Two repeated imports added nothing.

The original functional geometry and rules were retained; only 3 old LINEs and 1 old ARC were moved to diagnostic nets, with 2 NETs and 2 selectors added. All 207 saved/reopened `data` entries and IDs matched exactly. On an isolated copy, +5V and ACE_VIA functional nets, 12 added objects, and functional pads reported zero DRC issues; five issues remained on diagnostic old objects. The original-net 20-pass copy still had nine DRC issues, so neither the original board nor the whole board can be called DRC 0. The old five-pass, 203-object live result remains. No import loss or net-mapping defect was found; no code change or upgrade is needed. The temporary service exited and global configuration was preserved. The current retained result page is the unmodified-net, 20-pass, 203-object result. This conclusion applies only to this input and does not guarantee completion for arbitrary boards within 20 passes.

Bounded 0.20.123 host results (2026-10-27): Reading and conversion of the official mixed rules matched. Two bottom-layer width violations of 23 / 36 mil were rejected before writing, leaving 185 objects unchanged. After two valid tracks were added, 187 objects persisted after save/reopen (183 identical `data` entries and four omitted default display values). All IDs and the two new tracks' `data` remained; two repeated imports added nothing. The added tracks had zero `TrackError` and each had a preset floating `ConnectError`; the whole board had 28 issues.

An isolated geometry-combination copy completed official Start / Status / GetResult / explicit raw SES import. Slot-hole width of 11.811 mil, four DEFAULT conversions, and eight class conversions were retained in the same run. Independent checks of the 8,590-byte input / 5,584-byte output CRCs and raw SES bytes passed. Three ARCs / 89 protected segments were resolved exactly; 9 tracks and 3 vias were added, and all 12 added geometries were independently checked as correct. The original 191 `data` entries remained. All 203 `data` entries and IDs persisted after save/reopen; two repeat imports added nothing; `task=0`.

Whole-board connectivity did not pass in this sample: DRC reported nine issues, including one `ConnectError` on a new +5V via. The raw SES contained only one track and one via near a bottom-layer pad, with no path to the top-layer pad. Router logs explicitly reported 1 unrouted item and four existing clearance issues. Current evidence supports that the import matches the SES; the further cause of the unrouted path is undetermined. `COMPLETED` means the task ended. Do not record this as whole-board routing or production acceptance passed.

After the first online task completed, the connection and temporary service changed and the SES was not retrieved; the interrupted record was retained. Once it was confirmed that no board write occurred, the original task had completed, and the old process had exited, the flow was completed under a new task ID. No uncertain write was resent. The temporary service exited; global configuration and the original 191-object project were preserved. The missing-base behavior remains supported only by local conversion and pinned-JAR evidence; native host export with no base is not claimed. Other established objective limitations remain.

## 0.20.122 Default-Layer Rules, SAFE History, and Net-Class Combination (Bounded Host Acceptance Passed)

Version 0.20.122 passed bounded host acceptance. This version adds no call parameters; `applyLayerWidthRules` remains `false` by default. Explicit `true` handles confirmed DEFAULT-layer preferred widths and net-class layer widths together.

### DEFAULT Layer Rules

Retain the original structure-level global `width` text and add `(rule(width N))` inside signal layers; this differs from a class `layer_rule`. Each `default-layer-width` change records `layer`, `from`, `to`, and line number; class changes remain `kind:layer-width`. Keep an identical existing override. Reject the whole conversion without partial output for conflicts, duplicates, unknown structure, or incomplete mapping. This expresses only `preferred`; it does not turn min/max into DSN constraints.

For DEFAULT, evaluate a layer's own `width` first, then the global base. For NET, use the class `layer_rule` first, then the class base; DEFAULT does not override an explicit class. Evaluate each layer first, and merge into a scalar only when both EDA bounds and actual DSN widths match across all layers. Existing scalar comparison remains for cases without overrides. Networks without a class remain outside plugin conversion; the JAR's implicit default-network behavior is precedence evidence only.

Enabling conversion requires a unique, simple, positive structure-level global base width. A missing base is an explicitly unsupported input for this candidate, not an invalid DSN; a form that class-only handling previously accepted will now be rejected. New default-layer rules are limited to `width`; non-signal-layer rules and direct structure-level `layer_rule` remain rejected. Existing class-layer width plus valid clearance remains compatible.

### SAFE History

For an explicitly referenced SAFE, select the unique highest ticket independent of order only when all tickets under the same raw string ID are finite positive safe integers with no duplicates. Inspect only the latest entity profile; do not fall back when the latest is deleted or malformed. Different raw IDs remain unknown even if their JSON meaning appears identical. A valid reconstruction resolves only the old deletion of the SAFE referenced by the current mixed NET; other source ambiguity and deletions still block, and the original global diagnostics are retained. The history branch was verified by replaying real entity creation logs. Native host historical update logs were not obtained, so native host acceptance of that history branch is not claimed.

### NET_CLASS Combination

Typed-imported construction pairs were confirmed as retained by the host, with class-level SDK dual bindings, DRC, and save/reopen. TRACK is confirmed only for strict NET_CLASS SAFE+TRACK, matching class-owned Safe Spacing / Track values, and an explicit TRACK-only binding on the NET; explicit NET precedence remains. NET Safe Spacing is not required to equal the class value. Empty-NET class inheritance, mixed bindings on both sides, CLASS delete/rebuild exemptions, and SAFE spacing semantics are outside the added scope. Reliable input for parent and copper-layer coverage is still missing.

Three real saved inputs were replayed: four DEFAULT and two class conversions each; network and default comparisons matched, non-target source text was retained, and conversion was idempotent. A DSN generated in practice produced 9 tracks and 4 vias from an offline JAR; path widths matched. Old tracks were removed only from the offline input; the EDA drawing was not changed. Slot-hole / DEFAULT / class conversion passed in a combined submission regression. The official 0.20.122 profile confirmed per-layer ranges for two explicit NETs in a NET_CLASS mixed-binding sample. DSN comparison still reports differences with the option off. With it on, four DEFAULT layer rules and two class-layer overrides were disclosed individually; DEFAULT and both networks matched. Removing the six disclosed inserted fragments made the export byte-for-byte identical to the default export; the original 183 objects remained. Two 23 / 36 mil violations were rejected before writing, leaving 183 `data` entries and IDs unchanged. One valid ACE_VIA top 20 / bottom 30 mil track was added, with no via, retaining the original 183 objects. Repeats before save and after reopen added nothing; 185 `data` entries and all IDs remained, rules readback remained, and `task=0`. Each of the two new tracks had an intentional floating `ConnectError`, with zero `TrackError`; the whole board had 26 issues (the original 7 `TrackError` and 19 `ConnectError`), so do not call it a whole-board pass. Native history, parent/copper-layer coverage, DSN resaving, and production limitations remain. Do not record routine installation acceptance as host acceptance of the historical-log branch.

### 0.20.122 Online End-to-End Flow Supplement

Later online supplement: 0.20.122 completed the real online Start / Status / GetResult / explicit raw SES import on an isolated copy without old tracks. Nine tracks and four vias were added, and every geometry was independently checked as correct. Two repeat imports added nothing. The 183 IDs and `data` for the 13 new objects persisted after save/reopen (179 `data` entries were identical; four omitted default display values); immediate and reopened DRC both reported zero. The original 185-object project remained, `task=0`, the temporary service exited, and global configuration remained. This applies only to this sample; the 26 issues in the earlier mixed fixture and other conditional limitations remain.

The 2,144-byte official submitted DSN size and independent CRC32 both matched the service record. The retrieved 1,708-byte SES exactly matched the service output, and its independent CRC32 check passed. +5V top/inner layers were 30 mil and bottom was 15 mil; ACE_VIA top/inner were 20 mil and bottom was 30 mil. The 12 mil drill was explicitly supplied by the caller for this test, and the outside diameter was 24 mil; neither is a drill supplied by SES nor a production default. The interface had no unrouted-count field, so none was filled in as zero; service logs explicitly reported zero unrouted and zero violations. Submitting settings does not mean every substage was read back and confirmed.

## 0.20.121 NET SAFE and TRACK Combination (Bounded Host Acceptance Passed)

Version 0.20.121 has passed bounded host acceptance. This change adds only a validated mixed selector shape for NETs, retaining the existing TRACK-only and NET_CLASS paths. Call parameters are unchanged; the plugin checks internally, so callers need not submit rule evidence.

Support is limited to EDA 4.1.78, an exact NET target, `parent:null`, `ruleOrder:4`, and no copper-layer coverage, where `ruleKeyValue` contains exactly nonempty SAFE and TRACK references. SAFE must be unique, NORMAL, mil, ALL, and match the single-row structure saved natively in this run. For the same unique NET in the SDK, Safe Spacing and Track must match the two references respectively. Rule names and positive numeric values are not hard-coded. If source logs contain multiple history records for a same-name SAFE, this candidate remains unknown; confirming the reference structure does not mean SAFE spacing is accepted. Existing source uniqueness, deletion ambiguity, class membership, and complete layer checks remain. Other versions, extra fields, complex parents/coverage, malformed SAFE structure, or binding conflicts remain unknown. NET_CLASS mixed selectors are out of scope.

Here, SAFE is evidence of reference and structural consistency only; it does not interpret spacing-matrix semantics or relax slot-hole SAFE compensation conditions. Confirmed TRACK can be used for SES range checks, per-layer DSN comparison, and explicit `applyLayerWidthRules`. Definite violations are still rejected; other unknowns remain.

Two native paired projects contained 183 objects each and differed only in the NET selector's SAFE key. SDK Track was ACE_POWER20 in both; Bottom 23 / 36 mil reported a 25–35 range, Top 20 / 40 was valid, and Bottom 27 was valid. After save/reopen, the seven `TrackError` objects, rule names, and ranges matched; DSN width was 20 in both, while clearance was 7.99 / 4.02. Each whole board had 24 issues; neither is a whole-board pass. Later, the official 0.20.121 profile confirmed ACE_VIA's four-layer range. Explicit DSN conversion changed +5V bottom from 30 to 15 mil and ACE_VIA bottom from 20 to 30 mil; both networks matched per layer. A 23 / 36 mil SES was rejected before writing, leaving 183 `data` entries and IDs unchanged. One valid ACE_VIA track each was added at top 20 / bottom 30 mil, with no via. Repeats before save and after reopen added nothing; 185 `data` entries and all IDs remained, rule readback remained, and `task=0`. Each new track had an intentional floating `ConnectError`, with zero `TrackError`; the whole board had 26 issues (the original 7 `TrackError` and 19 `ConnectError`), so do not call it a whole-board pass. In this fixture, the default structural DSN width of 15.05 mil still mismatched per-layer defaults of 5 / 15 / 100 and 22 / 27 / 38; bottom/inner layers were below the 22 mil minimum; `routingConstraintsComplete:false`. Per-layer network matching does not mean structural defaults are complete or production-ready.

## 0.20.120 B4 Thickness, CLASS/DEFAULT Layers, and Explicit DSN Conversion

Version 0.20.120 passed bounded acceptance on EDA 4.1.78. Official thickness fields and save/reopen remained accepted. Mixed violations and unknowns were both returned, and writing was rejected before changes, leaving 181 `data` entries and IDs unchanged. Two valid tracks were added, top 30 / bottom 15 mil, with no VIA. Repeated imports before save and after reopen added nothing; 183 `data` entries and all IDs remained, with `task=0`. The added tracks had zero `TrackError` and each had an intentional floating `ConnectError`. The whole board had 22 issues (5 `TrackError`, 17 `ConnectError`); do not call it a whole-board pass.

The original 178-rule project remained read-only. Official DSN default bottom width was 20; when explicitly enabled, only a +5V bottom-layer override of 30 mil was added, with per-layer comparison matching across four layers and each conversion disclosed. Structural default 27.05 still mismatched EDA 27 mil; `routingConstraintsComplete:false`. A later isolated sample without old tracks completed the 0.20.120 online round trip. The actual service input matched the official 2,029-byte DSN size and independent CRC32. The retrieved 1,560-byte raw SES exactly matched the service output. Seven tracks and four vias were added to the source file; +5V top/inner were 20 mil and bottom 30 mil; ACE_VIA was 27 mil. The 24 mil via copper diameter and caller-supplied 12 mil test drill were confirmed; neither is a production default. Repeats before save and after reopen added nothing. All 181 IDs and new-object `data` remained (177 `data` entries were identical; four omitted `display:true`). Immediate and reopened DRC both reported zero. The original 183-object project remained; the task count was zero, temporary service exited, and global configuration remained. This result is limited to the sample and does not cover the earlier mixed fixture's 22 issues. Native evidence, offline routing, and manufacturing limitations below remain separately applicable.

### Thickness Evidence

`physicalLayerEvidence` retains `thicknessRaw` and adds `thicknessValueStatus` (`valid-nonnegative` / `invalid`) plus optional `thicknessMm`. Only when `editorVersion` is exactly 4.1.78 is `thicknessUnitStatus` set to `observed-mil-eda-4.1.78`; finite nonnegative numbers are converted to mm by multiplying by 0.0254. Other versions and invalid values do not produce mm. `unitEvidence` explicitly comes from native UI, source, and save/reopen observations; it does not claim a fixed quantization algorithm or error bound. A zero value does not prove material qualification; media are not filtered using `SUBSTRATE use:false`.

FR4 raw 59.449 → 47.244 corresponds to UI 1.51 → 1.2 mm; top copper 1.379 → 2.756 corresponds to 0.035 → 0.07 mm. Conversion retains the original quantization difference and is not rounded back to the displayed UI value. Repeated `zIndex` remains unknown; a unique numeric order represents source order only, not a fabricator layer mapping, nominal/finished board thickness, impedance, or order match. Relevant manufacturing comparisons can remain unknown; known units in an attachment do not mean manufacturing passed.

### Rule and Mixed-Binding Counterexamples

Strict DEFAULT multi-row rules were added for 4.1.78 / mil / open, along with binding confirmation for simple NORMAL multi-row rules referenced by CLASS. Row IDs are unique and completely cover the SDK-enabled SIGNAL set; each row has a valid range. NET, CLASS, membership, and SDK Track remain unique and consistent. When an explicit NET selects a different rule, NET precedence remains. When NET and CLASS are explicitly bound to the same rule name, the table is evaluated per layer. A strict empty NET selector with SDK default uses DEFAULT; it is not changed into automatic CLASS inheritance. Nonempty `parent`, `copperValue` / `innerPlaneValue`, SAFE+TRACK, and other complex selectors remain unknown. When a known violation and unknowns coexist, return the violation and retain `unknowns`. If DEFAULT ranges differ, `widthRuleComparison.defaultRule` may return per-layer `layers` comparisons; the first layer does not represent all layers.

### Explicit DSN Per-Layer Widths

Example call: `{cmd:"pcb.exportDsn",params:{applyLayerWidthRules:true}}`. `autoRouteStart` accepts the same switch. Omitted or `false` preserves existing export behavior; an invalid type is rejected before an SDK/service call. The plugin reads and checks source, focus, rules, and layer mapping internally; callers do not need to supply this evidence.

When enabled, handling is limited to verified 4.1.78, source mil, and DSN resolution mil1000. After all prechecks pass, add known positive preferred values that differ from the base width inside a unique single-network class; do not rewrite the base width, split multi-net classes, or modify EDA rules or SES. Retain non-target source text. `conversion.changes` records `kind:layer-width` with net / className / layerId / layerName / fromWidthMil / toWidthMil and line number. Keep an identical existing override; repeated application does not stack. Unknown rules, unknown membership, missing/duplicate layer mapping, override conflicts, or source changes are explicit rejections; auto-routing stops before submission.

The comparator recognizes verified class `layer_rule`; use the specified layer override or fall back to class base width. An override requires a unique exact layer mapping; net-scoped and structure-layer overrides remain unknown. Plain scalar comparison without overrides remains compatible. Final base64 / size, comparison, `routeBaseline`, and actual submission use the same text; existing plane/slot conversions and diagnostics remain. `routingConstraintsComplete` remains `false`, which does not mean the DSN expresses every design constraint.

Two real native DSNs received one and four added items respectively; non-target text remained byte-for-byte, and conversion was idempotent. Candidate-generated real-export-derived offline input produced 7 tracks and 4 vias in FreeRouting 2.5.0; +5V top/inner were 20 mil, bottom 30 mil, and ACE_VIA was 27 mil on each layer. This is path-width evidence, not whole-board production acceptance. Official 2.5.0 supports class-layer rules; the same declaration inside a net is ignored, and the scopes are not interchangeable.

## 0.20.119 Explicit NET Per-Layer TRACK (Bounded Host Acceptance Passed)

Version 0.20.119 completed this batch's one-time import acceptance in the independent `ACE_RULE_LAYER_INPUT_20261026` project on EDA 4.1.78. The initial 176 objects matched the saved 0.20.118 result. Official DSN returned four-layer +5V comparison: top and both inner layers 5 / 20 / 100 mil, with DSN 20 matched; bottom 25 / 30 / 35 mil, with DSN 20 at -10 from preferred 30 and `withinEdaBounds:false`. The result remained after save/reopen; `routingConstraintsComplete` remained `false`.

The controlled SES contained top 20 and bottom 20 / 40. The command rejected both bottom-layer violations before writing in 51 ms; independent readback confirmed zero changes to 176 `data` entries and IDs. Then one valid top 20 and one bottom 30 mil LINE were added; coordinates, layer, width, and net were checked individually, and the original 176 objects remained. Repeated imports before save and after close/reopen both returned `alreadyPresent:true`, `imported:false`, and `sesGeometryVerified:true`, with no additions. After reopening, all 178 `data` entries and IDs remained; `task=0`.

In one reopened DRC run, both added tracks had zero `TrackError`. The whole board had 16 issues; all 14 original issues remained individually, and each of the two intentionally floating tracks had one `ConnectError`. This acceptance proves per-layer width handling, not connectivity at test endpoints or a whole-board pass. Nonempty parent / complex copper-thickness inheritance, DEFAULT / CLASS multi-row rules, other unverified versions or units remain unknown. Manufacturing-parameter per-layer mapping has only synthetic calculation-input regression; real thickness, calculation, and order evidence remain incomplete. The native DSN's missing bottom-layer rule expression and the historical no-response cause remain as before.

# Specialized PCB Geometry Commands

## 0.20.119 Pre-Installation Candidate Record (Host Results Above)

Added the observed simple explicit-NET multi-row rule shape for EDA 4.1.78, NORMAL, mil, `track.isOpen:true`. Each row contains only `layerId` / `stroMin` / `stroDef` / `stroMax`; layer IDs are unique integers and widths are finite valid ranges. The row set exactly matches SDK-confirmed enabled SIGNAL layers, mapped by ID rather than row order. Source uniqueness, NET/CLASS selectors, SDK network membership, and bindings continue to be checked; incomplete or contradictory evidence remains unknown. The original single-row path is retained. DEFAULT/CLASS multi-row rules, other units/versions, nonempty parent / `copperValue` / `innerPlaneValue`, and complex DSN layer overrides remain unconfirmed.

`pcb.exportDsn` and `pcb.autoRouteStart` share per-layer comparison. If a network has different min/preferred/max values across layers, the network entry in `nets` gains an optional `layers` array. Each item contains `layerId`, `name`, `status`, `eda`, `dsnWidthMil`, `deviationFromPreferredMil`, and `withinEdaBounds`. Do not put a single `eda` / deviation / range decision in the aggregate network entry. A mismatch on any layer makes the network a mismatch; when every layer has the same range, retain the old structure. If source/focus is unstable, confirmed values for all layers also downgrade to unknown. This comparison reports only and does not modify DSN; `routingConstraintsComplete` remains `false`.

The four rows generated by the real UI for ACE_POWER20 were: Top / Inner1 / Inner2 5 / 20 / 100 mil, and Bottom 25 / 30 / 35 mil. Current native DSN has only class +5V width 20 and does not carry bottom preferred 30. Candidate replay explicitly reports bottom deviation -10 mil and 20 outside the 25–35 range; other layers match. The native DSN expression gap does not mean this candidate implemented layer-rule insertion.

`pcb.importAutoRouteSes` reuses the layer-selected range. Candidate replay found bottom 20 / 40 out of range, bottom 30 and top 20 / 40 in range; even when a batch contains both definite violations and unknowns, it is rejected before writing. Manufacturing-parameter checking continues to consume rules by `edaLayerId`; related top/bottom tests use synthetic validated-state inputs and are not real impedance-calculation or order evidence.

Sixteen related regression groups, offline replay of real saved/reopened samples, type checking, and expert review of the specific diff passed. Native host initial/reopened DRC confirmed that top 20 / 40 had no `TrackError`, bottom 20 / 40 triggered the 25–35 range, and all 176 `data` entries and IDs remained; this is evidence for 0.20.118 with UI rules, while 0.20.119 was not installed. Host writing of valid bottom 30 SES, official candidate per-layer DSN results, zero-write violation rejection, and save/reopen remain for unified acceptance.

## 0.20.118 Supplemental Host Evidence for Different NET and NET_CLASS Bindings

EDA 4.1.78, instance `a4b1b920`, isolated project `ACE_RULE_NET20_CLASS30_20261026`, UUID `7c1c5a330d8a4c12a992c6a31c32e3e3`. Only the +5V NET selector's TRACK was changed from `ACE_CLASS30` to the existing `ACE_POWER20`; its `ACE_TEST_CLASS` membership remained bound to `ACE_CLASS30`. The other 173 `data` entries and four 20 / 40 mil probes remained. After import, source and SDK clearly retained the two different bindings NET=20 and CLASS=30; DSN +5V output was 20 mil.

In both the initial run and after save/close/reopen, the +5V 20 / 40 mil probes had no `TrackError`; the same-run ACE_VIA 20 / 40 mil probes each triggered a DEFAULT 22–38 mil error. Whole-board DRC reported 10 items in both runs; do not call this a whole-board pass. After save/reopen, all 174 objects and IDs remained; 170 `data` entries were identical and four omitted display settings were listed separately. Rules and probes remained, `task=0`. The existing difference between default DSN 27.05 mil and preferred 27 mil continues to be reported; it was not silently adjusted.

This only adds host DRC evidence for the supported simple explicit conflict case; it is not a general inheritance interpreter. Nonempty parent, nonempty `copperValue` / `innerPlaneValue`, and multi-row/layer rules still need real valid samples and discriminating host comparisons; do not guess structure from field names. The 5 / 100 mil boundaries and interactive default routing width were not verified by this probe set. Runtime source was not modified and the frozen 0.20.118 package was not rebuilt. Evidence: workspace `rules-20261026/evidence/net20-conflict-acceptance.json`.

## 0.20.118 Bounded Host Acceptance (Normal Import, Idempotency, Persistence, and Isolated Target Connectivity Passed)

EDA 4.1.78 instance `a4b1b920`, normal-import project `ACE_STABILITY_ROUTE50_V118_20261026`, UUID `387ee67182b940d39252a100a0ffb5d4`. DSN exported from the 190-object copy was byte-for-byte identical to the original saved input. The unchanged, complete 50-pass SES returned normally with `imported:true`, `sesGeometryVerified:true`; 12 new LINEs and 2 new VIAs matched individually, all original 190 `data` entries remained, and 3 ARC / 89 protected segments were associated. First import took 5,224 ms. Repeats before save and after reopen took 4,238 ms and 4,297 ms respectively; both returned `alreadyPresent:true`, `imported:false`, with no additions. Save took 53 ms, close 1,728 ms, reopen 3,508 ms. All 204 objects and IDs remained after reopen; 200 `data` entries matched and only four PRIMITIVE display configurations omitted `true`. Final source remained, `task=0`. No DRC was run on this copy.

Isolated project `ACE_V118_PLUS5_ISOLATED_20261026`, UUID `d8db52709feb4a598e887146d6271807`, was based on the full route confirmed in 0.20.117. Only two old LINEs and one old ARC were moved from +5V to `ACE_ISOLATED_OLD_COPPER`. The two target PADs / two LINEs / one VIA, original +5V net, and all original rules remained. One NET and one host-generated exact empty RULE_SELECTOR were added, for 206 objects. The new selector was bound only to the isolated test net, with `ruleOrder:4`, empty `ruleKeyValue` / `copperValue` / `innerPlaneValue`, and `parent:null`. This exact record alone is listed; do not generalize that every empty selector can be ignored or claim complex inheritance is accepted.

SDK readback confirmed +5V had exactly two PADs, two LINEs, and one VIA, and the three old copper objects belonged exactly to the isolated net. Save took 62 ms, close 1,127 ms, reopen 4,150 ms; all 206 objects and IDs remained, with four omitted default display fields listed separately. The single DRC run took 1,764 ms: target +5V and five target objects had zero violations and connectivity errors. Whole-board result was 8 items: 5 old Physical Errors and 3 isolated old-net connection items, `passed:false`. Source remained after DRC; `task=0`. This comparison supports that the prior report in this sample was affected by an old same-net copper island; it does not establish acceptance for all SES files, the whole board, or real-world electrical behavior.

Evidence: workspace `stability-20261026/evidence/v118-route-acceptance.json` and `v118-isolation-acceptance.json`. Frozen 0.20.116 / 0.20.117 / 0.20.118 packages remain; no rebuild or release occurred. The trigger for historical renderer OOM and graphics-resource anomalies remains unknown; normal execution here is not recorded as a root-cause fix.

## 0.20.118 Pre-Installation Candidate Record (Host Results Above)

This change only handles identity changes for newly appended LINEs. On each step, compare the existing `getAllPrimitiveId` enumeration with original `before` LINE / TRACK objects, currently confirmed new LINEs, and this operation's candidate set. If a candidate disappears, a confirmed new line disappears, or an unregistered ID appears, first read and check the complete written prefix using the original focus and total budget. Continue strict checking of original object IDs, geometry, and valid source `data`; confirmed new VIA IDs; segment coverage/count; and attributes. Only after checks pass replace the current set of added LINE IDs; retain original candidates and identity-change facts in the existing journal. Apply the same check to the final fresh snapshot, then retrieve source records by current IDs. Normal flow does not add a full snapshot. Native and replace paths do not gain expanded permission. Parameters and SES text remain unchanged; do not retry or automatically save/reopen.

Fourteen related regression groups passed, including 11 new T-junction split cases. Real-sequence replay covered a merge on line 6 and a split on line 7 while its candidate remained present: frozen 0.20.116 stopped at line 6; frozen 0.20.117 failed on an old ID after writing 12 tracks; 0.20.118 source completed 12 tracks and 2 vias while the original 190 `data` entries remained. This is offline replay and does not replace a successful host receipt.

## 0.20.117 Partial Host Acceptance (Full Route and Persistence Confirmed; Command Receipt Failed)

EDA 4.1.78 independent project `ACE_STABILITY_ROUTE50_V117_20261026`, instance `91d03f89`. New DSN was byte-for-byte identical to the original saved input. The unchanged 50-pass SES sent 12 LINE and 2 VIA creations, all of which returned. Collinear merge on the sixth line was confirmed; a later T-junction split that horizontal track into two new IDs while the seventh candidate remained present, and the old ledger was not updated. Final geometry checks passed, but source lookup by old ID incorrectly reported failure. The response was `partial:true`, `restored:false`, `retryable:false`; compensation was skipped because replacement IDs were unconfirmed. No source was deleted or restored.

After the main agent independently checked 204 source objects and diagnostic SDK LINE / VIA / ARC data, the complete plan of 12 tracks / 2 vias, retention of original 190 `data` entries, absence of recovery writes, and `task=0`, work continued within the authorized scope to save, close, and reopen. Save took 64 ms, close 1,482 ms, reopen 4,333 ms. All 204 objects and IDs remained; 200 `data` entries matched, with only four PRIMITIVE display settings omitting `true`. A single DRC run returned normally in 2,066 ms with 10 items: 5 old-object Physical Errors and 5 +5V connection reports, including one on the new +5V VIA. There were no ACE_VIA connection items or PN items in this run. Source still had 204 objects after DRC; `task=0`.

This evidence does not mean 0.20.117 had a successful command receipt or target connectivity. The old +5V copper island and target routes share a net, so the current report cannot distinguish a local cross-layer issue from disconnection relative to another same-net copper island. Use a later isolated-net comparison; do not repeat DRC or loosen rules. Candidate 0.20.118 was not installed. Normal save/reopen and DRC return do not prove the historical OOM root cause was fixed.

## 0.20.117 New-Track Merge Adaptation Candidate (Not Yet Host-Accepted)

`pcb.importAutoRouteSes` retains the caller's SES. If an ID returned for a newly created LINE is absent from the full enumeration, read the full result within the original focus and total budget, then verify every LINE / VIA in the returned prefix up to that step, segment coverage and multiplicity, and the IDs, geometry, and valid source data of original LINEs / VIAs / ARCs. Update the currently confirmed new-LINE IDs only if an equivalent replacement for a new line in this batch is confirmed. Keep the confirmed IDs and drill sizes of new VIAs strict. Retain the original creation candidates and merge readback facts in the existing journal. Recovery may use only currently confirmed added lines and individually confirmed vias; do not delete using an invalidated candidate or unknown replacement ID. Parameters, SES contents, time budget, and automatic-save behavior remain unchanged.

The 0.20.116 independent copy reproduced two new collinear segments merging into a new ID; the command stopped at line 6. The original 190 `data` entries remained; the live board had 5 new LINEs / 2 VIAs, 197 objects, and was not saved/reopened or DRC-checked. Relevant 0.20.117 source regressions and real-geometry replay passed; frozen 0.20.116 still stopped at line 6 in the same replay. The replay-fixed version completed 12 LINE and 2 VIA creation calls; two input segments became one actual track, so the actual added LINE count was 11. On host acceptance, check the actual primitive count after merges; do not assert 204 objects as fixed.

This candidate is not installed; do not claim host import, save/reopen, or connectivity DRC passed. The exact triggers for the earlier render-process OOM and graphics-resource anomaly remain unknown; this adaptation does not fix that stability issue.

## 0.20.116 Bounded Host Acceptance (Repeat Import and Save/Reopen Passed)

The user explicitly agreed to one additional import to check only repeat-import behavior and data retention. In EDA 4.1.78 instance `29a21521`, independent project `ACE_B5_OVAL_ARC_BOTTOM_20261026`, the original SES returned by 0.20.115 and original `routeBaseline` were imported before save and again after save/close/reopen. Both calls returned `alreadyPresent:true`, `imported:false`, `sesGeometryVerified:true`; associations for 3 ARC / 89 segments remained. Neither call added a LINE or VIA; all 202 records and `data` remained, the exported object did not change, and task count was 0. Import times were 4,556 ms and 4,660 ms; save 51 ms, close 1,743 ms, reopen 4,242 ms.

No DRC was run and the old original PCB was not opened this round. The 12-item immediate whole-board DRC in 0.20.115 (including one unconnected new VIA), service report of 1 unrouted item / 4 warnings, and 300-second timeouts for reopened DRC and opening the old PCB remain unresolved historical items. Normal return for this bounded operation does not establish that the historical blank-screen cause was resolved. Evidence is in workspace `b5-oval-arc-20261026/evidence/v116-live-acceptance.json`, `v116-repeat-before-save.json`, `v116-repeat-after-reopen.json`, and `v116-final-source.json`.

## 0.20.116 Pre-Installation Candidate Record (Host Results Above)

After the first 0.20.115 import, the `ticket` of three valid ARCs changed from 171 / 172 / 173 to 174 / 175 / 176. Across four origins—after import, after save, after reopen, and after user restart—`type`, `id`, and all `data` remained unchanged. Tickets remained 174 / 175 / 176 after save, reopen, and restart. Therefore, 0.20.115 incorrectly rejected repeat imports; source did not change after rejection. 0.20.116 ignores `ticket` only when comparing valid ARCs. Both entry points use the same normalization; other header fields and all `data` remain strict, and `routeBaseline` shape is unchanged.

Fourteen related regressions, replay of independent real data, expert review, TypeScript check, and build passed. Independent replay used four actual installed-0.20.115 states: after import, after save, after reopen, and after user restart. Each state contained 3 ARCs and 89 protected segments; repeat diffs were 0/0, and nine categories of ARC identity/data changes were rejected. Replay did not install 0.20.116 and is not host acceptance for that version. Package details await the main agent's record; 0.20.116 is not installed, and consent for another import has not been obtained. Current new connection `afd9fc17` is at the start page; no PCB or DRC was opened, pending scope assessment.

## 0.20.115 Bounded Host Acceptance (First Combined Import Passed; Repeat Import Failed)

### First Import and Save/Reopen

The first same-source DSN/SES combined import completed on EDA 4.1.78. All 3 existing ARCs matched 89 protected segments; this import wrote 9 LINEs and 3 VIAs, retained existing objects, and passed SES geometry correspondence checks. Source data before import and after save/reopen contained 202 valid design records; no `data` representation change was found after reopening.

Immediate whole-board DRC had 12 issues. One new object had a connectivity error, traced to an unconnected `+5V` VIA; there were zero PN-branch objects. This is not a whole-board pass. The routing service returned `COMPLETED` but still reported one unrouted item and four warnings; do not infer that all paths were routed or DRC passed.

### Repeat-Import Failure and Reopened Readback

Importing the same combined SES again was rejected by 0.20.115 before writing: the three ARC header tickets changed from 171 / 172 / 173 to 174 / 175 / 176, but `type`, `id`, and all `data` matched. Source data did not change after rejection, so no duplicate write occurred. This was a candidate comparison defect; candidate 0.20.116 adjusted the matching rule.

The reopened DRC query timed out after 300 seconds; no result was available, so it cannot be recorded as zero. The user reported that the EDA window was unresponsive and restarted it. On new connection `31d3482d`, the main agent read 202 records only and `task.list` returned 0. Later `project.open` and `getInfo` on the original project succeeded, but opening its PCB timed out after 300 seconds; final readback of the original 190 records is still unavailable. UI observation showed the original project title with a blank workspace; live operation then stopped.

Host evidence is in workspace `b5-oval-arc-20261026/evidence/`: `v115-first-import-persistence-audit.json`, `v115-repeat-difference.json`, `v115-combo-import.json`, `v115-combo-repeat.json`, `v115-reopened-drc.json`, `v115-user-restarted-source.json`, `v115-restart-tasks.json`, and final live audit `v115-user-restart-audit.json`.

Fanout permits a valid zero-width filled copper shape and still treats its polygon as a copper obstacle. If the filled-copper path coordinates do not match the parent boundary, keep the plan non-executable and state that coordinate scale is not verified; do not multiply/divide by 10 yourself or ignore the copper. Native R rectangles expand downward from the top-left corner; do not approximate unverified R rotation or corner radius as a rectangular shape.

Read this page only for fanout, local copper, pad expansion, or net silkscreen tasks. See [Less frequently used PCB commands](commands-pcb-low.md) for command names. Check parameters, defaults, and return fields in `/help?cmd=<command-name>` for the confirmed version of the selected window.

## Shared Workflow

1. Activate the target PCB and read the current component, pad, or via IDs. A designator cannot substitute for a primitive ID.
2. Run the corresponding read-only planning command. Check `executable`, target, net, layer, geometry, `coverage`, and `warnings`. Do not write if the plan is not executable or coverage is incomplete.
3. Put the **complete `data`** from the planning response, unchanged, in the execution command's `params.plan`. Do not reconstruct or remove plan fields.
4. The plugin writes and reads back each item. If some items fail, retain objects already created, inspect the current board, and do not replay the old plan. These commands do not automatically perform board-level DRC, save, or manufacturing acceptance.
5. Run applicable checks and save. To establish persistence, close and reopen the document, then check it again.

Copper operations share the SDK total time limit. A timeout does not mean an issued call was cancelled; do not start dependent writes or replay the plan until the outcome is clear.

| Task | Plan → execute | Additional confirmation required |
| --- | --- | --- |
| Fine-pitch pad fanout | `pcb.getFanoutPlan` → `pcb.fanout` | Only routes from pads to breakout vias; the remaining nets still need routing. |
| Local copper | `pcb.getAutoCopperPlan` → `pcb.autoCopper` | Distinguish boundary copper `pour` from fixed copper `fill`; confirm the actual fill. |
| Pad expansion | `pcb.getPadExpansionPlan` → `pcb.expandPads` | Creates keep-out-pour, keep-out-fill, or solder-mask regions; does not change pad copper size. |
| Net text silkscreen | `pcb.getNetSilkscreenPlan` → `pcb.generateNetSilkscreen` | Text must be readable and not cover pads; check mirroring on the bottom layer. |

## Fanout Scope

Select targets by component, pad, or net. IDs must come from the current PCB. Set trace width, via copper diameter, drill, escape length, and spacing for the current design, in mil; the drill must be smaller than the copper diameter. For multilayer boards or through-hole pads, explicitly select the top or bottom layer. The current implementation creates through-holes; do not call them blind or buried vias. If the board outline, obstacles, pad shape, or rules cannot be safely parsed, the plan is not executable. Fanout does not prove full-net connectivity, DRC compliance, or manufacturability.

In a v0.20.59 installed-version sample, the plan for the +5V pad at R2.2 on the bottom layer returned `coverage.complete:true` and `executable:true`; execution successfully created 2 tracks and 1 via. After save, close, and reopen, IDs, net, layer, and 8 mil trace width remained, as did via dimensions of 24/12. Coordinates differed only by floating-point rounding of less than 0.001. Two already-connected ACE targets had no feasible routes; this does not mean the filled-copper readback sample failed.

## Local Copper and Filled Copper

`pour` is clipped by copper-pour rules and may leave only a boundary or no fill; `fill` is a fixed conductive shape. The two modes are not interchangeable automatically. Plans are grouped by net and copper layer; do not combine different nets into one copper shape. Current board-outline handling accepts only a verified single closed loop. If the outline has curves, multiple loops, or incomplete obstacle information, do not treat a partial plan as safe geometry.

After creating or rebuilding a copper pour, use `pcb.getPourFillReadback` for a read-only check of the associated fill, parent boundary, net, and layer. A nonempty fill path does not prove that the geometry is correct or meets manufacturing requirements. If readback fails or is unknown, stop relying on the write; a partial failure from an earlier command must not be reported as success.

New copper pours can specify `net`; `modifyPour` is not currently used to change the net or name of an existing pour. Manual operation in the EDA UI remains available; afterward check pour ordering, rebuild, and read back the actual fill. Do not recommend that AI automatically delete and recreate a pour as a lossless net/name change.

The v0.20.40 `pourCopper` single-R path candidate accepts only a one-dimensional path or exactly one wrapper layer and checks all seven items for exact equality; it rejects multiple rings, additional nesting, or changed parameters. Raw and normalized inputs are available for diagnosis. Unified candidate regression and newer-host validation remain pending.

Starting with v0.20.22, `pcb.autoCopper(pour)` independently reads back the actual fill even when the rebuild call returns empty. It reports success only after checking the parent boundary, net, layer, boundary, and valid fill. If there is still no fill, it returns a non-retryable partial write and retains the created boundary ID; inspect the live board first and do not rebuild again or delete automatically. This version has not received positive host acceptance for generating a solid fill.

Starting with v0.20.23, IDs in the rebuild return object are diagnostic only and do not prove that they identify fills newly created by this operation; `createdIds` should list only confirmed newly created boundaries. Before cleanup, check the drawing source and associated IDs; do not delete based directly on rebuild return IDs. An isolated host test on 2026-10-18 confirmed that an old underlying ID was not included in `createdIds`; the new top-level boundary still had no solid fill, so automatic copper has not passed.

Starting with v0.20.24, if foreign-net obstacles reduce the target expansion to zero, the plan warns about the first triggering obstacle and clearance rule. The plan is non-executable only when it can strictly prove that the final contour of a positive-expansion `pour` plan for one standard rectangular pad equals the pad itself. Complex or unprovable shapes are reported as uncertain. `executable=true` means only that plan checks allow execution; it does not guarantee that the host creates fill. Do not infer a larger boundary by increasing `expansion`; check the actual contours in `plannedPrimitives` and `warnings`.

In v0.20.43, the existing standard single-rectangle gate additionally recognizes `Pad` / `ComponentPad`, without changing its conditions. Finite `Number` values are converted through decimal `String` into a local `BigInt` rational model to exactly compare the four corners from center ± half-size and the closed edges; a different start point or winding direction is allowed. This does not change global geometry comparison, use tolerance or rounding, or ignore tiny expansions. If unsupported or strict comparison differs, the result remains uncertain. This method cannot restore precision inside the host or guarantee a fix for all no-fill issues. Candidate local and host validation remain pending. Four small islands that do not touch the pad are assessed separately.

The v0.20.39 `autoCopper` connection-rule candidate preserves original sources and selection state. Unknown selection or inapplicable coverage in `fill` mode is diagnostic information only and does not guarantee fill generation. It does not change the `autoCopper` default of `false`, fixed copper regions, or execution semantics. Final local review and host acceptance remain pending.

- The v0.20.46 candidate retains source `thermalGap.raw` and `sourcePath`, while keeping the unit as `unknown`. `unitLabel` is recorded separately and is not used to infer mm or mil. Copper-rule `selection` remains `unknown`.
- `pcb.getComponentPads` adds a per-pad, read-only `heatWelding` diagnostic with statuses `null`, `config`, `unavailable`, `exception`, and `invalid`. Only an explicit `null` from the getter is recorded as `null`.
- Read exceptions return `{status:"exception",error:{message}}`; invalid values return `{status:"invalid",returnedType,reason}`. If the getter is unavailable, it returns `{status:"unavailable"}`.
- `config.value` lists only `connectionMethod`, `divergenceSpacing`, `divergenceLineWidth`, and `divergenceAngle`. Missing optional fields are not filled with zero. Reading a configuration does not prove override priority or which rule the host actually used.
- No command parameters or write behavior were added. Local and host validation remain pending; this does not mean the four-island geometry issue is fixed.

## Pad Expansion and Net Silkscreen

Pad-expansion modes are keep-out-pour, keep-out-fill, or solder-mask expansion; none adds conductive copper. Plans support only explicitly covered pad shapes. Curves are approximations, and the actual solder-mask openings must still be checked in manufacturing output. Do not remove any complete contours or subdivisions from the plan.

Net silkscreen consists of editable text and does not create electrical connections. Check the target pad's net name, text layer, rotation, and bottom-layer mirroring. After execution, also check visual spacing from pads, the board outline, and other text.

---

# DFM and SMT Checks

# JLCPCB Order Checks (PCB DFM)

> This page describes `pcb.runDfm`, `pcb.runSmtDfm`, `pcb.checkSameNetPadSpacing`, and the PCB menu “JLCPCB Order Checks.”
> Commands use the existing `/command` channel.
> The outer request must still include `instanceId`.

## 1. Compare Process Inputs with the Drawing

`pcb.runDfm` checks support for the copper thickness selected in the current inputs: check 5 uses the selected outer-layer copper thickness, and check 6 uses the selected inner-layer copper thickness.

Checks 12 and 13 use the selected outer- or inner-layer copper thickness, respectively, to obtain thresholds from the original process table, according to the design's copper layers and layer count.

Process-table values and geometry algorithms are unchanged.

Other checks still estimate the number of effective copper layers using the existing copper-primitive heuristic.

The PCB result also includes `reportedCopper`, separate from the DFM verdict. Its `status` is `available`, `partial`, or `unavailable`.

`layers` has the shape `[{layerId:number, thicknessMil:number|null, copperOz:number|null}]`.

`matchesTarget` is a boolean or `null`.

`differences` has the shape `[{layerId, requestedOz, reportedOz}]`.

`messages` is an array of diagnostic strings about collecting copper-thickness sources.

The requested copper thickness is still listed in `inputs`.

Check standard values reflect the current outer/inner copper-thickness inputs and their corresponding thresholds.

The latest Slot Region drill-slot check reads by row and column: row 8 is Slot Region, and Track at column 0 is `0.2999994 mm` (11.811 mil). Row 11 in the old table is BoardOutline; do not reuse that old row number. In a copy, only this scalar was changed to 25. After save/reopen, the DRC value remained 25, while `fill-slot` remained 10. The latest schema's unit-flag difference is reference information only; do not convert automatically.

If the drawing's copper thickness differs from the current input, an `LAYER_PHYS` record is missing, or the drawing thickness cannot be parsed, represent this only in `reportedCopper`. Do not add it to `issues` by itself or treat DFM as failed for this reason.

If a source-read error affects required geometry, identity, or API data, it must still be added to `issues` under the existing rules and make the check incomplete.

Copper-thickness corroboration does not exempt it.

The drawing's outer/inner 1 oz values in the v0.10.91 field report are source readings; they do not mean the user requested 1 oz for the order.

A discrepancy alone is not a DFM failure.

## 2. Run Applicable Checks

| Command | Purpose | When to use | Limitation |
| --- | --- | --- | --- |
| `pcb.runDfm` | Run PCB process checks. | After material, board thickness, and copper thickness are determined. | Covers only the 18 checks returned. |
| `pcb.runSmtDfm` | Run SMT assembly checks. | After selecting the assembly process. | Covers only the 7 checks returned. |
| `pcb.checkSameNetPadSpacing` | Check spacing between pads on the same net. | When checking same-net process spacing. | Covers only this spacing check. |

- `material` accepts `FR4`, `HDI board`, `high-frequency board`, `aluminum substrate`, or `copper substrate`.
- `thickness` uses mm and must be a finite positive number.
- `outerCopperOz` must be the number `1` or `2`.
- `innerCopperOz` must be the number `1`.
- The user must provide the copper thickness for the current order requirements.
- Do not fill in the requested copper thickness from the drawing or a default value.
- `standard` accepts `economy` or `standard`.
- `minSpacingMm` uses mm and must be a finite positive number.
The supported material enum is defined by `JLC_SUPPORTED_MATERIALS`, exported from the reused upstream core.

The check implementation reuses [the upstream project](https://github.com/easyeda/eext-jlc-order-dfm-checker) v1.0.4, source commit `afd538786d510f537ad4fa47c6329e6a99dc7625`, under the Apache-2.0 license.

No dependencies were added.

The process parameter table and geometry algorithms come from this upstream version. They are not necessarily synchronized with current process options on the JLCPCB website.

The original upstream v1.0.4 interface accepts only material and board thickness.

`outerCopperOz` and `innerCopperOz` are local enhancement fields.

This implementation supports only outer-layer 1/2 oz and inner-layer 1 oz; these are not all manufacturer options.

`pcb.runSmtDfm` and `pcb.checkSameNetPadSpacing` do not add copper-thickness inputs.

The PCB DFM form in the menu requires the user to select outer-layer 1 or 2 oz and inner-layer 1 oz explicitly.

These options apply only to PCB DFM.

Before use, confirm that v0.10.92 or a later version containing this enhancement is installed, and that online command help shows both copper-thickness parameters.

Older v0.10.91 does not support these parameters and may ignore the extra fields.

Adding parameters to a request sent to an older version does not prove that the check used the requested copper thickness.

The new report must echo `inputs.outerCopperOz`, `inputs.innerCopperOz`, and `reportedCopper`.

## 3. Interpret Results and Completeness

The `data` in a successful command response retains `results`, `expectedCount`, `issues`, and `coverage`.

Each `issues` item contains `code`, `message`, and an optional `item`.

`data` also contains `documentUuid`, `checkType`, `inputs`, `timestamp`, `upstream`, and summary fields `upstreamPassed`, `complete`, and `passed`.

`upstreamPassed` is a field name retained for compatibility. It indicates whether every adapted and reused result is `success`.

It does not mean the official online service passed, nor that the algorithm is identical line by line.

The menu and TXT label this “all individual checks passed.”

Passing an individual check is not the same as passing the full check.

Report a pass within the command's coverage only when `complete:true` and `passed:true`.

When `complete:false`, `passed` must also be `false`.

A command response with `ok:true` means only that the handler returned successfully; it does not mean `data.passed:true`.

The three check types retain the expected 18, 7, and 1 raw results, respectively.

If required input for the current check is incomplete, reading failed, or a fallback/inferred value was used, the adapter marks the check incomplete.

Do not report a complete pass.

For example, failed source reads, partially readable net data, missing pad dimensions, or a fallback used because there is no board outline cannot produce a passing verdict.

Copper-thickness request parameters have no defaults.

Copper thickness read from the drawing is handled separately in the next section.

Review `coverage`, completeness flags, and the `upstream` description; do not look only at `passed` or the number of issues.

## 4. Check What Is Not Covered

These checks reuse the upstream plugin's parameter table and algorithms. They are not a full JLCPCB online DFM check or manufacturing approval.

Geometry coverage has explicit approximations: track spacing checks only positive gaps for `Line`; it does not cover contact, overlap, `Arc`, or `Polyline`.

Oblong and non-circular annular rings are approximated using their major axis.

Same-net pad spacing uses capsule and inscribed-circle approximations.

Effective copper layers are estimated heuristically from layers that contain copper primitives.

EIA/BGA types are identified by name.

Location IDs are matched partly by indices in two lists, so issue locations may be inaccurate.

Menu location is for viewing assistance only.

It cannot modify the drawing automatically.

Have an engineer review the raw results together with `coverage`.

## 5. Menu Location and Report Export

The PCB top menu “JLCPCB Order Checks” provides the three checks above and shares the same check processing and result aggregation as AI commands.

The menu can display individual results and issue locations.

When the user clicks “Export TXT” or “Export JSON,” the host save dialog lets them choose where to save the report.

AI commands do not open dialogs, clear logs, or write reports automatically.

Command execution itself does not save, repair, upload, or place an order.

Location is provided for viewing assistance.

It does not modify the drawing.

If the active focus or PCB identity changes after a menu or command starts, subsequent reads and report delivery stop.

Before locating an issue, confirm that the target PCB is the current board.

Do not use coordinates from another board for locating it.

If an old DFM window session expires, close the old window and reopen it from the PCB menu.

The menu form, AI command, and TXT/JSON export should show the same `inputs`, outer/inner thresholds, and `reportedCopper` comparison.

---

### v0.20.69 Autorouting Rule Report

`exportDsn` and `autoRouteStart` return `widthRuleComparison`; `importAutoRouteSes` returns `widthRuleCompliance` for added segments, independently of `sesGeometryVerified`. `automaticNeckdown` defaults to `false` and is enabled only by explicit `true`. Rule differences, confirmed violations, and unknown ranges are reported separately. Widths are not silently changed, and automatic writeback or persistent locks are not restored. See [PCB workflow](commands-pcb.md) for parameters and scope. The installed version passed EDA 4.1.78 service readback with default `false` and explicit `true`, rejection of two out-of-range cases, and save/reopen for two valid SES cases; DRC was zero in both. Differences in neckdown geometry effect remain unverified; full routing constraints are not covered.

## Drawing Thickness Raw Values and Ordered Copper Weight (0.20.74 Candidate)

The current host's `LAYER_PHYS.thickness` unit has not been verified. `reportedCopper.layers` retains `rawThickness`, `sourceType`, `sourceId`, `sourceTicket`, and `unitStatus:unconfirmed`. Do not convert the raw value to mil or oz; compatibility fields `thicknessMil` and `copperOz` remain null.

`matchesTarget` remains null and `differences` is empty; this means there is no reliable copper-weight comparison conclusion. `status:available` means only that required raw records were obtained reliably, not that units, copper weight, or order were confirmed. Missing records, invalid identity, or log conflicts are reported as partial or unavailable respectively.

`pcb.runDfm` continues manufacturing-capability checks using outer/inner copper weights explicitly supplied by the caller. Unknown raw-thickness corroboration alone does not fail DFM and cannot replace order checking. UI and TXT/JSON reports retain the same raw values and unknown-unit note.

### 0.20.74 Bounded Host Acceptance for Raw-Thickness Receipt

In the independent B123 project on EDA 4.1.78, raw values for four copper layers matched source; source identity and ticket were readable; mil/oz compatibility fields and `matchesTarget` were null, with no further false copper-weight-match report. Manufacturing-capability checks using supplied copper weights remained. All 193 design-record `data` remained. An independent unconnected pad on the test page still made overall DFM incomplete. This accepts the raw-value receipt only; it is not a whole-board DFM pass or order confirmation.

## One Manufacturing Profile for Design, Calculation, and Ordering (0.20.77 Candidate; Installed Version Pending)

`pcb.checkManufacturingProfile` read-only checks declared parameters against current PCB rules. It does not save parameters, modify the board, or place an order. Use one portable JSON file as the parameter source and pass its contents as `profile` at call time. Do not put parameters in the user's project description or describe this extension's local configuration as project-persisted.

`profile` fields:

| Field | Content |
| --- | --- |
| `schemaVersion/profileId/revision` | Fixed version 1, unique profile-file identifier, revision identifier |
| `manufacturer/productType/stackupId` | Explicit fabricator, product type, and specific stackup name |
| `source` | `{url,observedAt}`, the actual source and lookup time |
| `selection` | `{copperLayers,nominalThicknessMm,outerCopperOz,innerCopperOz}`, copper-layer count, nominal board thickness, outer/inner copper weights |
| `officialStackup` | Same `stackupId` and `orderedLayers:[{name,kind,thicknessMm,material?,dk?}]`; kind is copper/prepreg/core; unknown thickness or Dk is the string `unknown` |
| `officialStackup.finishedThicknessMm/finishedTolerancePercent` | Optional finished thickness and tolerance explicitly listed for the stackup; not an impedance guarantee |
| `calculations` | Optional calculation-record array; fields described below |

When copper-layer count exceeds two, `selection.innerCopperOz` must be a positive finite number. One- and two-layer boards must omit inner copper weight; do not put a false value or null. Apply the same condition to order selection; a missing order must not be hidden by saying inner copper is inapplicable.

Each calculation record uses `id/stackupId/source/evidenceStatus/model/targetOhm/signalLayer/topReference/bottomReference/widthMil/spacingMil/copperGapMil/widthSpacingComplement/bindings`. `evidenceStatus` is `verified` or `unverified`; `verified` means only caller-provided visible calculation evidence and is not independently authenticated by the plugin. `orderedLayers` is ordered top to bottom; all layer names must be unique. `signalLayer` and reference layers must refer to copper-layer names in the file. The upper reference must precede the signal layer and the lower reference must follow it. Use null for a side explicitly having no reference layer; omit a field not yet confirmed. Do not use null to mean unknown.

`model` is `single-ended-non-coplanar`, `single-ended-coplanar`, `differential-non-coplanar`, or `differential-coplanar`. Only differential models use `spacingMil`; only coplanar models use `copperGapMil` for the ground gap. Do not fill inapplicable values with zero. `widthSpacingComplement` records the calculator's actual compensation switch; it does not default to off. This switch is not an impedance tolerance.

`bindings:[{net,edaLayerId,layerMappingSource}]` explicitly records network, EDA-layer identity, and mapping basis. Fabrication layer name L1 is not itself an EDA `layerId`. Within one file, fabrication signal-layer and EDA-layer identities must map one-to-one; one mapping may be used by multiple nets. Without a mapping, do not guess the network or use a default rule as if that network's rule were known.

`orderConfirmation` must be an actual confirmation record containing `schemaVersion:1/confirmed:true/source/manufacturer/productType/stackupId/selection`. A planned value is not a confirmed order. An omitted `impedanceService` means unknown; null means explicitly not commissioned. If commissioned, provide `{source,calculations:[{id,targetOhm,model,signalLayer,topReference?,bottomReference?,widthMil?,spacingMil?,copperGapMil?,widthSpacingComplement?}]}`. The order and profile calculations correspond by ID. This record comes from the caller; the plugin does not independently read the ordering website.

Receipt `items` report `matched` / `mismatch` / `unknown` / `not-applicable` per item, with both values, units, sources, and reasons. `overall` is `mismatch`, `incomplete`, or `matched-within-scope`. Missing required evidence cannot produce an overall pass. Physical units and layer order on EDA 4.1.78 remain unconfirmed, so the overall result remains incomplete; raw `LAYER_PHYS` records can include historical entries and tombstones and do not prove an effective stackup.

Nominal 1.6 mm and finished 1.59 mm listed by a stackup are different definitions and are compared separately. Copper-weight selection and per-layer thickness are also recorded separately. A core group labeled “with copper” is not counted again as an extra layer. Do not fill in stackup Dk from generic FR4 data or generate a production guarantee from an approximate formula.

Official sources: [stackup page](https://jlcpcb.com/impedance), [impedance calculator](https://jlcpcb.com/pcb-impedance-calculator). The 14.12 mil value seen in the browser during this round is retained only as an unverified development sample; it is not a built-in default, production selection, or confirmed order.

### Source-Address Structure Validation (0.20.77 Candidate)

The 0.20.76 installed build incorrectly rejected a valid URL while validating source parameters, before project reads. The original implementation depended on `new URL` and treated all exceptions as invalid input. Removing this constructor locally reproduced the issue; this was not a direct measurement of the host global object.

For profile, calculation, and order records, 0.20.77 uses a unified local absolute-address structure check. HTTP(S) checks host, authority, and port; absolute schemes such as file/mailto/urn remain supported. Chinese paths and structurally valid internationalized hosts retain their original values. Relative addresses, control characters, raw whitespace, broken percent escapes, and malformed authority are rejected.

This check does not depend on the browser URL constructor, access the network, modify addresses, or perform full WHATWG/IDNA parsing or normalization. A structurally valid address does not prove a real source and does not change `unverified` to `verified`. The first fix candidate still needs installed-version acceptance; local regression is not a substitute for host results.

### 0.20.77 Source Compatibility and Partial Read-Only Scenarios Accepted

In the independent B123 project on EDA 4.1.78, the same sample that failed under 0.20.76 returned normally. Four copper layers matched; six-versus-four layers and nominal board-thickness differences were detected. Wrong targets, invalid sources, and reversed reference layers were explicitly rejected; a later independent normal read was not persistently locked.

Eighteen independent checks passed. Original rows for 194 design records remained; project and target page remained. No profile was written, saved, or used to modify an order. Same/different order fields used clearly test-only synthetic records, proving comparison branches only, not a real order confirmation or production parameters.

Unverified calculations still show `unknown`; a missing order does not return overall pass. The actual rule report includes unknowns related to disabled inner layers and empty network selectors, so the known-net preferred-width/min-max comparison branch has not received host acceptance. Physical stackup units/order, full impedance, and real order consistency are not confirmed by this result.

### Trace-Width Configuration Read Adapter (0.20.78 Candidate)

Shared width reading skips explicitly disabled SIGNAL layers with `status:0`, retaining enabled layers with status 1/2. Missing or invalid status remains unknown; if all are disabled there is still no confirmed enabled layer. The complete layer list remains part of before/after stability checks.

On EDA 4.1.78, a NET selector strictly matching the identified shape and containing only `NET_LENGTH_TOLERANCE` is no longer treated as a TRACK selector. It must be ordinary `parent:null`, `ruleOrder:4`, with both layer-coverage objects empty and length value explicitly `[ruleName,targetNetOrNull]`. Do not guess whether an empty network name means wildcard or no-net object. Selectors with TRACK, unknown rule keys, nonempty parent/coverage, other scopes, and deletion/conflict handling retain existing boundaries.

This adapts configuration reading and comparison; it does not prove host DRC execution or actual impedance compliance. Unconfirmed order, physical units/order, and unverified calculations still preclude an overall pass. Shared parsing also serves DSN/SES; automatic writeback remains disabled and existing widths/rules are not changed.

Official basis for rule-category slots: [selector format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/rule_selector.md). The format supports configuration classification only; it is not expanded into a host-runtime or manufacturing guarantee.

### 0.20.78 Bounded Host Acceptance for Width Reading and Comparison

Twenty-nine checks were completed in the independent B123 project on EDA 4.1.78. Four enabled copper layers were correctly identified; +5V preferred width was 20 mil and ACE_VIA preferred width was 10 mil, with current allowed ranges of 5–100 mil. The two existing false-positive rule reads disappeared in the installed build.

Synthetic calculation records tested preferred-width match, deviation while still in range, out-of-range value, unverified calculation, and nonexistent net. The latter two remained explicit `unknown`; they did not fall back to defaults or gain verified status. Synthetic records prove comparison behavior only, not real impedance or order.

Four-versus-six-layer difference, caller order-record thickness difference, wrong target, invalid source, reversed reference layer, and normal reads after errors all passed. Original rows for 194 design records and project/document identity remained. All operations were read-only; nothing was saved or closed/reopened and no rule or order was changed.

This section updates the earlier pending state for the known 0.20.77 width branch. Current B4 rule-reading and comparison branches have completed bounded acceptance; physical stackup units/order, real calculations, and order consistency remain unconfirmed. `routingConstraintsComplete` remains `false` and does not mean all-board routing constraints, DRC, or production requirements passed.

### Route a Differential Pair Along a Specified Path (0.20.79 Candidate; Installed Version Pending)

`pcb.routeDiffPair` creates coupled positive/negative polyline traces along a center path. Check help in the current window before calling. `pair` explicitly supplies `{positiveNet,negativeNet}`; both nets must exist and differ. `path`, `width`, and `gap` use mil. `gap` is copper-edge spacing; centerline spacing is `width+gap`.

The positive side offsets along the numeric normal `[-dy,dx]` in the direction of path traversal; the negative side offsets in the opposite direction. Visual left/right depends on coordinate direction. Reversing `path` swaps the spatial sides of the traces, not their input net names.

First use `dryRun:true` to read and preview; omission or false executes writes. The selected layer must be an enabled SIGNAL layer. Remove only geometrically equivalent consecutive duplicate points and same-direction collinear intermediate points; do not snap or extend the input. New segments retain the 1 mil minimum. Reject the whole pair before writing for reversal, self-contact, insufficient spacing between any positive/negative segments, or unreliable numeric values.

Both sides share the document and time budget. Read back segment-by-segment, then check final source coverage, non-target records, and rules. A mid-operation failure returns `partial` with completed sides and failed-candidate evidence, then stops later steps. A timeout does not cancel a host operation; do not resend, automatically delete, or roll back. Later independent commands are not persistently locked.

`plannedLengths` describes only this path, not measured whole-net length. Length difference caused by turns is returned explicitly. This command does not automatically avoid obstacles, tune lengths with serpentine traces, handle duplicated parallel pads, or create a differential rule; it does not save automatically. After success, still check actual connectivity, whole-board DRC, reference planes, and length difference as required by the project. Do not infer impedance compliance from successful creation.

```json
{"cmd":"pcb.routeDiffPair","params":{"pair":{"positiveNet":"USB_DP","negativeNet":"USB_DM"},"path":[[100,100],[300,100],[500,300]],"width":6,"gap":4,"layer":"top","dryRun":true}}
```

Example values demonstrate parameters only; they are not USB design parameters. Production width/spacing should use sourced stackup and calculation records, then be compared against rules and the actual order. Differential length tolerance must follow the specific interface requirements; do not default to 10 mil.

### 0.20.79 Bounded Host Acceptance for Specified-Path Differential Routing

Twenty-one checks passed in an independent B123 project on EDA 4.1.78. `dryRun`, seven groups of invalid input, and normal execution after errors left the original drawing intact. Six LINEs across straight and 45-degree-turn cases were created/read back and persisted after save/close/reopen; the original 194 records remained and all 200 saved records remained after reopening.

Source length on each side of the straight case was 200 mil. In the 45-degree case, source lengths were 235.6223648810721 and 247.2203475935823 mil, a difference of 11.5979827125101 mil. These are source measurements for this path, not whole-net or physical measurements.

Requested gap was 8 mil and source gap for the straight path was 8 mil. The 45-degree source minimum gap was 7.9998657393562 mil, short by 0.0001342606438 mil. The host stores coordinates to four decimal places; maximum single-coordinate deviation was 0.00004746830584 mil, within the predeclared 0.001 mil readback tolerance. An additional first-pass 1e-9 mil check failed and its original evidence is retained; do not state actual gap is strictly at least 8 mil.

Native DRC listed only 9 Connection Errors and no spacing errors. Test traces were not connected to the functional interface; this is not evidence that whole-board DRC, connectivity, length matching, or impedance passed. Serpentine compensation and Type-C duplicated-pad branches have not been implemented. This section updates the earlier pending 0.20.79 candidate status; bytes in the old frozen package are unchanged.

### Serpentine Length Tuning (0.20.80 Candidate; Installed Version Pending)

`pcb.tuneLength` adds length to an open routing chain inside a specified region. `net`, `targetLength`, and `region:{xMin,yMin,xMax,yMax}` use the current PCB's net and mil coordinates. `targetLength` is the selected chain's total centerline length, not the sum of every branch on the whole net.

Use `primitiveIds` to explicitly select one open chain with the same net, layer, and width, and no locked objects. If omitted, `net` and `region` must fully contain exactly one candidate straight segment. `tunePrimitiveId` can select one adjustment segment in the chain. The command replaces only that segment; other selected segments remain. `region` bounds the new copper outline, and both ends of the adjustment segment must lie fully inside it.

First inspect a plan with `dryRun:true`; omission or false writes. `side` is `auto`, `left`, or `right`; direction is relative to the path after sorting endpoints by coordinates, with positive normal `[-dy,dx]`. `auto` tries both sides and available adjustment segments. If the current serpentine family cannot be found, a reason is returned; that does not prove all possible routing shapes have no solution.

Prefer applicable project rules under D12. The current SDK has no reliable interface for reading local serpentine tolerance or self-spacing, so explicitly provide `lengthTolerance` and `minSelfGap`. The first is total-length error; the second is copper-edge spacing between nonadjacent segments involving the new serpentine. Do not newly require that two unmodified old segments meet this value. Do not substitute differential gap, differential default 10 mil, or a net-relative length tolerance. Geometry readback tolerance of 0.001 mil is separate from cumulative length tolerance. `parameterSources` reports explicit values and rule mappings whose applicability is unconfirmed; it does not claim the values were automatically obtained from the project.

If the target is already within total-length tolerance, return `changed:false` without writing. If target is shorter and outside tolerance, report an explicit error. New segments retain the 1 mil minimum. If a branch, pad, or via joins the old trace mid-segment, verify the connection will be retained; if this cannot be confirmed, identify the object and reason before writing. Do not guess for special shapes, cross-layer scope, or unknown actual copper-fill contact.

During execution, first create and read back the new local path, confirming the old line and non-target records remain; then delete the explicitly identified old adjustment segment; finally check enumeration, source, and actual total length. A failure can return `partial`, new-line IDs, deletion attempt, and old-bypass status; `unknown` means it cannot be confirmed. Stop relying on the result; do not automatically retry, roll back, or save. Later independent commands are not persistently locked.

Reported planned and actual lengths apply only to the selected chain. Report actual minimum spacing as measured; do not clamp it to the requested value. Success is not whole-board spacing, connectivity, impedance, or manufacturing acceptance; still check the specific interface and actual stackup. Type-C duplicated-pad branches and automatic routing are separate development work.

Parameter illustration: select a 200 mil test straight, target 220 mil, explicitly set `lengthTolerance` and `minSelfGap`, then preview with `dryRun`. Example lengths and tolerances are selected for testing and are not default design parameters for USB, DDR, or other interfaces.

### 0.20.80 Bounded Host Acceptance for Serpentine Length Tuning

Twenty-three checks were completed in the independent B123 project on EDA 4.1.78. Read-only preview, eight invalid-input groups, no-write behavior when target was already reached, and a normal call after errors all passed. The eight invalid-input cases and preview retained the original 200 design records.

In case 1, a 200 mil straight was replaced with a four-segment serpentine; actual total centerline length was 219.999952549915 mil. In case 2, a 200 mil straight in a two-segment open chain was tuned in the opposite direction; the other 70.71067811865476 mil diagonal kept its ID and data, and actual chain length was 290.71063066856976 mil. Each case was about -0.000047450085 mil from target, within the explicitly supplied 0.01 mil total-length tolerance.

Minimum copper-edge spacing involving the new serpentine was 30.66661456870542 mil in both cases, against a test requirement of 8 mil. Host source coordinates had four decimal places; maximum single-coordinate error was 0.000047683481 mil, below the published 0.001 mil readback tolerance. These values measure test paths, not production defaults or whole-net electrical length.

Both old adjustment segments were confirmed deleted; the other 198 original records remained, along with 8 new serpentine LINEs and one chain-end diagonal. After save, close, and reopen, data and headers for all 207 records remained; old segments were not restored.

Reopened native DRC listed only 11 Connection Errors. Compared with the original 9, the expert confirmed seven original objects remained, while two reports on old isolated straight lines became four reports on the new open-chain endpoints; no separate report identified the new/old adjacent interface. This better supports open-end aggregation as the report behavior, but is not proof from native connected-component analysis. Retain `connectivityVerified:false`, `boardClearanceVerified:false`, and `impedanceVerified:false`; do not automatically refresh endpoints or describe geometry success as electrical acceptance.

Bytes in the old candidate package remain unchanged. This section updates the self-owned skill state; Type-C duplicated-pad and B6 cases are handled separately. Existing local regression covers branch protection for T-junctions, pads, vias, unknown objects, and abnormal-write paths; do not call all of them host-tested in this round.

### Circular Serpentine Revision (0.20.81 Candidate; Installed Version Pending)

The user explicitly requested circular serpentine geometry. This version of `pcb.tuneLength` uses real LINEs and tangent ARCs, not short polyline segments approximating arcs. The 23 results for 0.20.80 remain evidence only for the old triangular polyline geometry and persistence; the arc style requires new acceptance.

Retain `net`, `targetLength`, `region`, `primitiveIds`, `tunePrimitiveId`, `side`, and `dryRun`. Add required `bendRadius` in mil for the arc centerline radius. Prefer project rules whose applicability is confirmed. The current SDK has no verified mapping for local serpentine radius, tolerance, or self-spacing, so explicitly supply `bendRadius`, `lengthTolerance`, and `minSelfGap`, and return parameter sources. Do not set a general production radius or use the differential default of 10 mil.

Each rounded U-turn unit consists of four 90-degree arcs, outbound/return legs, and a top straight. A unit fully covers the segment to be replaced; do not create lead-in traces overlapping the old baseline. Search for feasible unit count at a fixed radius. Omit zero-length straights; nonzero short primitives retain the current 1 mil input policy. If radius, space, spacing, and added length are incompatible, return an explicit error; do not silently change radius or fall back to polyline.

Total length includes true arc length. Check arc extrema and half-width within the region. Approximate arcs with sampled chords bounded by sagitta error only for contact calculations; these chords are never written to the PCB. Check serpentine spacing against the analytic curve family, handling old-entry protection separately; do not incorrectly reject construction segments from adjacent arcs as independent branches.

Create and read back each primitive as a LINE or ARC. For ARCs, verify type, endpoints, sweep direction, radius, and true arc length. A valid reversed storage representation must both swap endpoints and reverse sweep. Order the actual curves used in later calculations in planned traversal order and retain actual readback deviation. After confirming the new path and retention of old data, delete only the explicitly identified old adjustment segment; finally check source, both SDK enumerations, rules, and total length separately.

`dryRun` returns actual primitive plans and sampling scale, not a large number of tiny calculation chords. Success distinguishes the planned spacing lower bound for the serpentine family from the source-readback lower bound; neither is a measured minimum for the whole chain or board, and spacing between two unmodified old segments is not compared. Unknown writes return `partial` and stop, retaining typed creation IDs, deletion attempts, confirmed deletions, and old-bypass status. Do not automatically retry, roll back, save, or persistently lock.

Native connectivity, impedance, reference plane, and whole-board DRC must still be checked for the actual project; do not infer acceptance from arc readback. Choose test radius for the test only; do not make it a USB, DDR, or manufacturing default.

Official references: [90-degree arc equal-length pattern](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/index.html), [ARC API](https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_primitivearc.create.html), [PCB ARC format](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/arc.md). Interface and format documentation do not replace testing on the current host.

### ARC Endpoint Readback Compatibility (0.20.82 Candidate; Pending Acceptance)

The installed 0.20.81 run stopped while reading back the second arc. The original 207 records and old test straight remained; no attempt was made to delete the old line. The second ARC source was a correct DOT negative-90-degree arc; an SDK property-check failure alone must not be treated as a wrong drawing direction.

0.20.82 adds read-only diagnostic `pcb.inspectCurveReadback`, which reads a fresh getter by explicit type and ID. Check parameters in the current installed-version help. The diagnostic returns SDK getter values, same-ID source, and differences; it does not create, delete, or save primitives.

ARC write checking supports a one-decimal SDK endpoint projection only with exact source constraints. This applies to ARC endpoints only; type, ID, net, layer, width, and signed sweep remain strict. Source DOT geometry is still checked at 0.001 mil; length, center, radius, and tangent are computed exactly from source. Report an explicit error when a rounding boundary cannot be confirmed; do not treat ordinary 0.05 mil error as equivalent. Disclose actual readback mode and SDK raw values.

After candidate installation, first diagnose the existing failed ID read-only and confirm the fresh getter has this representation difference, then perform new write and save/reopen acceptance. Current simulated inputs come from failed source and batch APIs; they do not replace fresh getter evidence or installed-version acceptance.

### Multi-Unit Arcs and Old-Bypass Segments (0.20.83 Bounded Host Acceptance Passed)

The installed 0.20.82 build confirmed one-decimal ARC endpoint representation difference using a fresh getter. One U-unit's four ARCs and three LINEs were successfully written; actual measured length was 220.000097150257 mil with explicit 0.01 mil tolerance, and it persisted after save/close/reopen. This does not establish multi-U acceptance, whole-board connectivity, or impedance acceptance.

In multi-U geometry, when an interior contact point touches the original straight, the current EDA splits the target straight into segments with new IDs. 0.20.82 stopped before actively deleting it; the old bypass copper remained as two segments. The 235-record failure scene persisted after save/reopen.

0.20.83 retains real-arc planning and recognizes only a complete segmented replacement for the explicitly targeted straight. All original records outside the target must remain intact. After excluding typed IDs created by the writer, every extra record must be a new-ID LINE; all properties except endpoints must match the original target. Segments must be collinear and cover the original interval with no overlap or gap; internal split points must come only from this operation's planned baseline contacts. Do not infer ownership from the same net or nearby location.

Delete the confirmed old-bypass ID set only after new arcs, length, contacts, source, and all fresh bypass-segment SDK values are verified. Receipt reports original target, host replacement IDs, old bypass segments, newly written path, and IDs actually confirmed deleted by the command separately. Unknown or partial deletion stops; do not automatically retry, roll back, or persistently lock.

0.20.83 completed two related regressions, type checking, review by the same expert, build, and package check of 72 files. On EDA 4.1.78 installed version, real single-U and double-U LINE/ARC writes, deletion of old bypasses, and save/close/reopen passed. Clean single-U target was 220 mil and actual 220.000097150257 mil. Double-U with tail target was 338.309518948453 mil and actual 338.309713248967 mil. Explicit 0.01 mil length tolerance, 7 mil radius, and 8 mil self-gap were specific to this test, not production defaults. The original 235 records remained in both cases; after clean comparison, all 264 records' data and headers persisted across save/reopen. Fresh getter readback of 16 new ARCs in batches showed no differences. Invalid parameters and `dryRun` wrote nothing; later independent commands remained available.

For the double-U, the host replaced the original target with two bypass segments. After confirming ownership, the plugin deleted only those two segments and retained the tail. The receipt disclosed host replacement and command-confirmed deletion separately. The original failed scene remains; do not clean it automatically.

Native DRC still did not pass on the whole board: a retained early single-U placement collision produced 4 spacing errors, with another 18 connection errors. The clean single-U and this double-U had no reported spacing error; this is not native connectivity-component, impedance, or production acceptance. Do not infer those passed from arc geometry and length.

# 0.20.115 Concentrated Development Candidate (Deduplicate Existing SES ARC Protected Chains)

This candidate supplies `routeBaseline`, corresponding to the DSN actually submitted to the router, through `pcb.exportDsn`, `pcb.autoRouteStart`, and `pcb.autoRouteGetResult`, so `pcb.importAutoRouteSes` can recognize existing ARC-protected chains in SES. The parameter shape adds one optional object. AI callers should retain the complete `pcb.exportDsn` response from before routing and pass its `routeBaseline` unchanged to the import command.

`pcb.exportDsn` creates an export record from valid PCB source and the actual final DSN; callers must retain that response and matching DSN to ensure it is the router's input. The record is bound to `documentUuid`, current valid DOT ARC source records, and complete point sequences for the corresponding `protect` wires in actual DSN. If source, layer mapping, or actual DSN cannot be fully associated, `routeBaseline.status` is `incomplete` with a reason and cannot resolve ARC protected chains. `pcb.autoRouteStart` binds the export record to a job only after DSN is successfully submitted as service input. `pcb.autoRouteGetResult` returns the record with the result when that job association is available. If job mapping is unavailable, use the retained pre-routing `pcb.exportDsn` response corresponding to this exact DSN input. Without that old record, it cannot be proved that ARCs did not change during the job. Exporting again after the fact is not a substitute.

### Exact Association Conditions During Import

`pcb.importAutoRouteSes` accepts raw SES and an optional `routeBaseline` object. Before import, check current PCB UUID, valid source ARC records in the object, and complete DSN point sequences, then re-export native DSN. Current source snapshot must be stable, and the regenerated export record must be complete and match the supplied object. Then match each existing protected wire against SES by wire type, net, layer, width, and full point sequence. Exact reversed point sequences are allowed; missing/extra points, splitting, duplication, rerouting with the same endpoints, or missing/changed source are rejected.

Confirmed existing ARC-protected chains are excluded from the new-object diff and reported under `existingArcCoverage`, with ARC ID, DSN/SES wire sequence numbers, protected-segment count, and direction. Import does not rewrite caller SES; it converts only the diff into a write plan. Actual new tracks still undergo existing width-range, minimum-segment-length, and geometry-readback checks; new vias continue to use existing drill-size and geometry handling. Repeated submission of geometry already present returns `alreadyPresent` without duplicate writes.

Ordinary hand-authored SES with no existing ARC-protected chain can omit `routeBaseline`. If omitted while SES contains a protected chain corresponding to a current ARC, reject before writing; do not guess whether it is a new track.

### Support Boundaries and Candidate Status

Handle only finite, nondegenerate DOT ARCs confirmed in current valid source and supported copper layers, requiring a complete, unique, stable corresponding point sequence in the current actual native DSN. ARC-chain matching is confirmed only for the mil/1000 coordinates validated in this batch. Other unit normalization can be conservatively rejected by exact-point comparison even for a 1 ULP difference. Ordinary inch/mm imports with no ARC-protected chain continue on the existing path.

Before writing, reject wires with multiple paths that may mix existing ARC-protected chains and new lines; do not silently discard remaining paths. Existing handling for ordinary multi-path SES without an ARC-protected chain remains. Final candidate replay included this rejection counterexample; expert review for P1 confirmed the rejection is closed, with no actionable production-source issue. Final command regression used consistent mock fixtures and passed source/SDK consistency checks; repeated submission wrote nothing. `freshDSN`, source, focus, and multi-path rejection all passed.

Exact reversed point sequences are allowed; split, resampled, missing, duplicated, or source-changed protected chains cannot pass validation. This candidate does not claim support for every ARC format or transformation.

If a complete export record for the same project was not retained, an ARC now deleted or moved elsewhere cannot prove its historical origin; this feature does not inspect all historical edits. Bounded 0.20.114 top/bottom OVAL/ARC host records and its failed combined-import result remain below; source replay for this candidate does not change 0.20.114 combined acceptance to passed.

Independent replay of real candidate data used frozen 0.20.114 input and covered 3 ARCs / 89 existing protected segments; expected diff was 9 LINEs and 3 VIAs, with repeat diff 0 LINEs / 0 VIAs. Nineteen rejection counterexamples and complete reversed protected chains passed. Fourteen related regressions, standard `tsc --noEmit`, and build passed. Expert review confirmed the multi-path rejection is closed and production source has no actionable issue. Final command regression used consistent mocks and passed source/SDK consistency checks; repeated submission wrote nothing; fresh DSN, source, focus, and multi-path rejection passed. Package details await the main agent. See the opening of this topic for bounded host results after 0.20.115 installation.

## Repeated-Pad Branches

### 0.20.114 Bounded Host Acceptance (Branches Passed; Combined Import Failed)

Top- and bottom-layer OVAL/ARC branches were written, saved, closed, and reopened successfully. Each project added 4 LINEs and retained original primitives; target DRC was zero. Whole-board DRC still had 15 violations. A same-source DSN/SES combined import in the same run failed: 89 existing ARC polyline segments were identified as new, including 53 segments from an existing `+5V` ARC at 20 mil. Without source association, they were checked as new tracks and violated the 25–35 mil rule, so they were rejected before writing with zero writes. Routing service returned `COMPLETED` but still had one unrouted connection and four existing warnings; do not call the entire board routed. R5 is adding deduplication by associating existing complete ARC polylines. The user agreed to one additional unified import acceptance after completion.

### 0.20.114 OVAL Pads and Arc-Trunk Concentrated Development Candidate (Pending Installation Acceptance)

This candidate adds ordinary, non-plated, outer-layer OVAL capsule PAD origins to `pcb.routePadBranches`, supporting horizontal, vertical, rotated, and equal-width degenerate-to-circle forms. The model uses capsule end caps, not an ellipse. Plated, eccentric OVAL, and special-layer support is not expanded.

For independent PADs, prefer exact dimensions from valid source. EDA 4.1.78 getter dimensions are accepted only on exact match or the empirically confirmed nearest 0.1 projection, with projection delta disclosed. Device PADs continue to use the SDK global anchor from this run's `getAllPins()` and SDK model precision; this does not change the unconfirmed precision/error bound for embedded footprint source.

`trunk` retains existing `primitiveId` and `endpoint` fields and may point to a LINE or a verified actual ARC endpoint; no interface field was added. An ARC becomes confirmed contact only if valid source exists for the same ID and fresh `inspectArcReadback` matches. Failed readback, missing source, or inconsistency remains unknown. Signed sweep participates in contact and spacing checks. Reject before writing for broad contact, insufficient different-net spacing, or multiple disjoint contact positions. `arcContactResolution` reports source status.

New `BranchContact` is for branch-path analysis only. Existing length-tuning logic remains conservative with the new contact type and leaves it unknown; it does not misclassify it as a rectangular PAD. This candidate does not expand to plated/eccentric pads, special layers, whole-board automatic obstacle avoidance, or production connectivity guarantee.

Source and local regressions passed, and 0.20.113 real-source/getter precheck provides implementation/precheck evidence only, not proof that the new 0.20.114 branch ran on EDA. Install one final package, then conduct formal acceptance on an isolated copy, checking written geometry, net, and layer, and save/close/reopen.

0.20.85 completed bounded acceptance of three branch-write groups, source geometry, and save/reopen on EDA 4.1.78. Native electrical connectivity did not pass acceptance. Broad PAD enumeration can include device pads; the plugin determines ownership from actual device membership and does not infer it from concatenated IDs. `pcb.routePadBranches` is for parallel repeated pads on two explicitly named signal nets. It is separate from differential trunk `pcb.routeDiffPair`; do not infer pin numbers, nets, or impedance width from a device name such as Type-C.

Inputs are `pair:{positiveNet,negativeNet}`, `layer`, `width`, and `clearanceMil`. Each side provides `{joinPoint:[x,y],branches:[{padId,waypoints?}],trunk?:{primitiveId,endpoint:"start"|"end"}}`. Units are mil. Both nets must already exist and differ. `clearanceMil` is a lower bound for different-net copper edge spacing, not a constant differential gap; even zero does not permit different nets to touch. The 1 mil minimum applies to nonzero segments, not trace width.

Resolve each start from actual PAD ID. When `waypoints` is omitted, connect directly to join point; when supplied, they are intermediate points only. Independent PADs prefer exact coordinates and supported shapes from valid source, reporting any confirmed getter tenths projection separately without rounding source. Device PADs use the global SDK anchor from this `getAllPins()` run, without adding device offset or rotation again. Device length, contact, and spacing conclusions are limited to this SDK geometry model; embedded footprint source precision/error bound remains unconfirmed.

Supported shapes are reliably interpretable circles, rotated rectangles, and plated through-hole circles. A through-hole can start a trace inside the hole, but a subsequent continuous path prefix must contact the annular ring. For an uninterpretable special layer or complex shape, report the specific PAD and field. Do not ignore nearby unknown conductive shapes; a reliably distant bounding box can exclude them.

Same-side branches may meet only at the join point or merge earlier and share a continuous suffix. Shared suffix segmentation points need not align. Reject before writing if routes touch, separate, then merge again, or leave the target pad and loop back. If `trunk` is specified, the actual LINE's net, layer, and selected endpoint must match the join point; if omitted, report only that branches join, not that they connect to an existing trunk.

The command executes directly; `dryRun:true` is optional read-only preview and no plan token is required. The plugin writes serially and verifies source geometry and complete non-geometric attributes. Legal host LINE merge/split can change IDs; validate final coverage rather than drawing blindly when an old candidate ID disappears. Partial failure retains completed segments and failed stage, then stops later writes. Do not automatically retry, roll back, save, or persistently lock.

Report each PAD-anchor-to-join length separately. A shared suffix can appear in multiple paths; do not sum those values as one signal-path length. Results are not whole-board DRC, native electrical connectivity, actual copper-fill, or impedance acceptance. After execution, still check, save, and read back as required by the task.

### 0.20.85 Installed-Version Acceptance Scope

Independent circular PAD direct branches, fractional-coordinate origins, a plated through-hole prefix followed by annular-ring contact, deduplication of a shared suffix, and branches from real device PADs using the SDK model were written. Three groups of 11 pad paths were checked against lengths and source coverage. The host merged shared suffixes and an existing trunk, changing LINE IDs; the command confirmed coverage normally and did not draw duplicate lines. All 289 valid final records and attributes persisted after save/close/reopen, and `data` for all original 264 historical records remained.

No native spacing error was reported on added objects. The test board still had 4 old spacing errors and 23 connection errors. Some new local objects were also listed in connection errors; native reports did not identify disconnected object pairs or connectivity groups. Saved source had no expected local endpoint gap, wrong net, or wrong layer, but this cannot rule out native connectivity issues or attribute them to a test net not connected elsewhere. This accepts only checked geometry, retention, and save/reopen; native electrical connectivity, whole board, impedance, and production were not accepted.

### 0.20.86 Connectivity Comparison for New Net with Ordinary SMD Pads

Two named nets were created, each with only three ordinary top-layer circular SMD pads, two branch traces, and a trunk. One pad whose creation had already been confirmed was reused without resending. Across both nets, six PADs and six LINEs passed complete source checks. Original 292 records remained; `data` / `header` for all 305 final records persisted after save/close/reopen.

Reopened native DRC listed no connection or spacing errors for these two new nets or their 12 objects. This controlled ordinary SMD sample passed a bounded connectivity check. The test board still had four old spacing errors and 23 old connection errors. This does not newly accept through-hole, device, or old same-net shapes from 0.20.85; causes of their connection reports remain unconfirmed. The command itself does not run DRC, `connectivityVerified` remains `false`, and whole-board, impedance, and production acceptance are out of scope.

## Autoroute Result Retrieval (0.20.87; Bounded Read-Only Retrieval Passed)

Retain `jobId` from `pcb.autoRouteStart`, then call `pcb.autoRouteStatus {jobId}`. Once status is COMPLETED, call `pcb.autoRouteGetResult {jobId}` to obtain `fileName` and `base64`. Retrieval checks task identity, format, Base64, UTF-8, and currently supported SES structure; it does not modify short segments, coordinates, widths, or drill sizes in the file.

Retrieval does not import, delete, save, or run DRC. A service job marked COMPLETED does not mean routing is complete; consider unrouted count when available. Only a later explicit `pcb.importAutoRouteSes`, with original `fileName` / `base64` and required parameters such as via drill, writes. Its pre-write checks remain independent. Segments shorter than 1 mil can be retrieved as-is, but import explicitly rejects them under the original input policy and does not merge them automatically. Compatibility with current PCB layers and rules is also checked separately by import and design review.

Retrieval parameters must explicitly specify `jobId`. Status query may clear “recent task,” so do not rely on empty parameters to get a result. If the plugin remembers the document at start, report only the known binding; if unknown, do not guess current page. Binding does not prove original PCB source remained unchanged. Service filename is only a result filename, not a local path.

The same `jobId` can be retrieved repeatedly read-only. Timeout means the read did not finish; it does not restart routing or make PCB-write outcome unknown. The plugin still provides no CLI to run the service; CLI distribution and REST service are handled separately.

### 0.20.87 Installed-Version Read-Only Retrieval Acceptance

Installed version on EDA 4.1.78 retrieved a 1,861-byte SES from an already completed external job and retrieved it again; filename, Base64, and decoded bytes matched the original service file. When original document binding was unknown, it explicitly returned unknown. Then, from the current test PCB, the plugin ran Start, Status, GetResult and retrieved an 18,842-byte file with correct original-PCB binding. Counts of 105 wires and 4 vias are SES structural statistics only; no import occurred. Original 305 `data` / `header` remained; task count was zero. Empty `jobId` and wrong document were rejected first; later independent request succeeded.

Real service logs showed COMPLETED alongside 4 unrouted items and 4 violations, so completion state is not routing or DRC acceptance. Empty objects or missing unrouted fields in API statistics must not be treated as zero. Retrieval retains original file and service statistics and does not fill in counts itself. This round did not import the result, run EDA DRC, or save/reopen; full B6 flow requires separate acceptance.

On first attempt the temporary service had exited; EDA returned HTTP 500 and direct local-port access was refused. No plugin modification was made on that basis. After restoring the controlled service, read succeeded. Reason for service-process exit is unconfirmed. Temporary service has ended; user global configuration was preserved.

### Silkscreen Lines and Arcs Candidate (0.20.88 Historical Candidate; Actual POLY Coverage Failed)

`pcb.checkSilkscreen` keeps its existing parameters. SDK-enumerated straight lines and arcs on top/bottom silkscreen are added as bounding-box candidates and compared with same-side text, designators, lines, arcs, and pads; copper-layer and opposite-side objects are excluded. Missing API, valid ID, layer, or bounding box is explicitly listed as unsupported.

Returned silk lines/arcs may come from footprints; complete enumeration and source mapping have not been proven. Nearby/overlapping bounding boxes mean review is needed only; `confirmed` remains false and `complete` remains false. This does not prove actual glyphs, ink collisions, or complete silkscreen DRC. Manufacturing output is checked separately.

### B6 Same-Source Copy Import Acceptance Supplement (2026-10-23)

0.20.87 completed explicit SES import, immediate DRC, and save/close/reopen in an independent same-source four-layer copy on EDA 4.1.78. Ten new tracks and four 24/12 mil vias matched original retrieved SES geometry individually within 0.001 mil; immediate and reopened DRC both reported zero. Original 170 records remained after import. Of the 184 reopened records, only four omitted `display:true` from class-display settings; other `data` and headers remained. Display equivalence was not checked separately. Effective net-class width rules still returned unknown, so rule checking did not pass. This does not guarantee arbitrary PCB routing or production compliance.

### Silkscreen Polyline Candidate Adaptation (0.20.89 Bounded Host Acceptance Passed)

0.20.89 completed bounded host and save/close/reopen acceptance for three real POLYs on EDA 4.1.78. One text-neighbor candidate on each side remained unconfirmed; remote, opposite-side, and copper tracks were excluded. The 178 design `data` entries remained during checking; reopened geometry remained; four omitted default display values and the empty-net default-length rule supplement were recorded separately. Curved POLY passed a separate bounded comparison later; complete footprint enumeration and exact ink collision were not established in this acceptance.

Native EDA 4.1.78 saved silkscreen test traces as POLY, absent from ordinary Line enumeration. `pcb.checkSilkscreen` adds an overall SDK Polyline bounding-box candidate, compared with same-side text, designators, other silkscreen, and pads; paths are not split. SDK silk Line/Arc results remain additional checks.

Return types add `silk-polyline`; coverage adds `checkedSilkPolylineCount` and `unsupportedSilkPolylineCount`. Source mapping and complete enumeration remain unproven; candidate `confirmed:false` and overall `complete:false` remain. Copper-layer and opposite-side objects are excluded; manufacturing output is checked separately. 0.20.88's Line/Arc-only entry missed this real POLY; it cannot be treated as a version accepted for silkscreen-stroke coverage.

The 0.20.89 added arc comparison also passed on EDA 4.1.78. A native arc was saved as a POLY with an ARC path and correctly entered the overall `silk-polyline` bounding-box candidate, returning an unconfirmed candidate against same-side text and a straight line. After save/close/reopen, 179 `data` entries, arc path, and candidate pair remained; one side of the SDK bounding box differed by about 0.0000305 mil within the 0.001 mil comparison tolerance, not bit-for-bit identical. This does not prove exact curved-ink collision, complete footprint enumeration, or full B2 acceptance.

## 0.20.90 Order Calculation Set and SES Diagnostics (Bounded Installed-Version Acceptance Passed)

0.20.90 passed bounded installed acceptance on EDA 4.1.78: extra impedance calculation IDs in an order were individually listed as mismatch and unverified status remained; SES-specific unknown net-class causes were returned correctly; 10 tracks / 4 vias matched original file geometry; immediate and save/reopen DRC were zero. Unknown rules remained unknown. A B5 device-pad two-endpoint isolation sample also passed immediate/reopened target DRC checks; 311 geometries and nets remained, four omitted default display representations were separately listed, and the whole board still had 25 old issues. Footprint silkscreen coordinate mapping and net-class inheritance parsing were not fixed by this work.

`pcb.checkManufacturingProfile` returns each impedance calculation ID found only in the caller's order confirmation record as a separate `order.calculation.<id>` mismatch. Calculation IDs on both sides must correspond; do not silently ignore extra calculations in an order. Do not modify the order or profile, or change `verified` / `unverified` calculation status. Missing physical layers, Dk, or real order data continue to be reported in the existing scope.

`pcb.importAutoRouteSes` retains `widthRuleCompliance.unknowns` as an array of strings, now with net, layer, and locatable reason for each track. Status and violation criteria are unchanged; an unknown rule does not become a pass and no persistent lock is added. NET_CLASS inheritance and empty-selector relations remain unconfirmed; do not guess precedence.

B5 also completed a same-import-condition net-scope comparison: the unmodified copy reproduced three connection reports for a target via and two SMD pads; a copy differing only in isolated-net membership had zero target reports immediately and after save/reopen. Geometry remained; four class-display default-value representation changes were listed separately. This supports a relationship between old reports and external same-net scope. The whole board still had 24 old issues. Device-PAD two-endpoint comparison later passed on an independent save/reopen copy; do not call this general connectivity or whole-board acceptance.

## 0.20.91 Explicit Single-Net Rules Bounded Pass; Footprint Enumeration Failed

`pcb.checkSilkscreen` adds an independent source check for footprint lines. The plugin reads embedded footprints in the current document and associates actual device, footprint reference, and pose. Initial handling covers simple straight POLYs on local top silkscreen; local bottom silkscreen, complex paths, or unclear source are listed individually as uncovered. Footprint source identity retains device ID, footprint UUID, and local primitive ID; it is not represented as a board-level SDK primitive ID. Nearby objects remain unconfirmed candidates; manufacturing-output checks are separate and overall check remains incomplete.

Line transformation was checked point-by-point against official Gerber for five poses of an isolated footprint, including bottom-side 37 degrees; save/reopen retained actual geometry. The official installed build had an empty embedded-footprint list and did not return the 30 lines. The five-component coverage gap was retained honestly; this is not B2 acceptance.

A net that belongs to a class but has its own explicit simple TRACK rule can be confirmed on EDA 4.1.78 only when source, SDK class membership, and rule value agree under the confirmed structure. Empty-selector inheritance, complex selectors, conflict, or insufficient source remains unknown. The plugin checks automatically; callers need not resupply rules that it can read. DSN, SES, and manufacturing-parameter checks share this parser. Within scope, deviation from preferred value is not a violation; DSN-default difference is reported separately; `routingConstraintsComplete` remains false.

## 0.20.92 Project-Library Footprint Source Supplement (Bounded Host Acceptance Passed)

0.20.92 passed official instruction acceptance on EDA 4.1.78: current project-library read supplemented exactly 30 straight lines from five devices, matching checked manufacturing geometry for the five poses. After save, close, and reopen, 190 design `data` entries, source identities, lines, and candidates remained; data remained during checks and `task=0`. Local layer 4, complex paths, and full B2 remain unaccepted. Explicit single-net rule readback remained correct in this version; empty-selector inheritance remains unknown.

When document embedded-footprint lists omit footprints referenced by actual devices, `pcb.checkSilkscreen` reads from the current project library by verified footprint UUID. The plugin itself confirms project-library identity, device reference, pose, and source identity, then rereads after checking. Source is distinguished as document-embedded or project-library; do not fall back to personal, system, or public cloud libraries or overwrite discovered conflicts. If read is unclear, retain per-device uncovered notices; an empty list does not mean there is no silkscreen.

For source-confirmed simple straight POLYs on local top silkscreen, continue to transform endpoints and compute bounds using half line width. Complex paths, local bottom silkscreen, and complete enumeration remain uncovered. Nearby candidates remain `confirmed:false`; manufacturing output is reported separately; overall check remains incomplete. The 0.20.91 explicit single-net TRACK path remains accepted based on the 20/30 mil host comparison and pre-write rejection of an out-of-range SES.

## 0.20.93 Multi-Segment Footprint Silkscreen and Bottom-Layer Grouping Fix (Bounded Acceptance)

`pcb.checkSilkscreen` adds source-confirmed footprint-local layer 3/4 straight paths. Supports `[x0,y0,"L",x1,y1,x2,y2,...]`: one `L` followed by continuous finite coordinate pairs; repeating the start point means closed. Each POLY retains one source identity and returns ordered local/global `points`, `closed`, and `segmentCount`; `a`/`b` are the first/last point. Bounds include every vertex plus half width; for bottom-side devices, the manufacturing side of local top/bottom silkscreen is swapped. Curves, unknown commands, and invalid paths are listed in their entirety as uncovered. Nearby candidates remain bounding-box candidates; `confirmed` and overall `complete` remain false.

Forty paths and 60 segments in an independent fixture were matched segment-by-segment against actual Gerber, including top/bottom 0 and 90 degrees and bottom 37 degrees. The official 0.20.93 command also retrieved all 40 paths / 60 segments; point order, layer, source, bounds, and nearby candidates matched comparison. They remained after save/close/reopen. All 190 design records and 44 footprint records remained; two read-only checks did not change data; task count was zero. This is limited to covered straight-line paths, not full B2 acceptance.

`pcb.groupBySchematicRegions` fixes bounds for eccentric bottom-layer footprints by mirroring local y first, then rotating and translating. The extraction remains the existing approximate bounds and does not represent exact boundaries for all entities. Source measurement regression passed; when live embedded enumeration is empty and SDK fallback is used, do not claim the source branch passed on host.

# Networks and Manufacturing Exports

## 0.20.94 Footprint Arc Silkscreen (Bounded Host Acceptance Passed)

The footprint-source channel in `pcb.checkSilkscreen` adds POLY ARC and mixed L/ARC paths. ARC parameters use signed sweep in degrees and format `[x,y,"ARC",angle,endX,endY]`; bottom-layer mirroring reverses sweep. Each POLY retains one source identity. Local/global `segments` distinguish lines and arcs; an arc includes start/end, center, radius, and sweep. `points` are path nodes only, not sampled arc polylines. Bounds use quadrant extrema traversed by each arc, expanded by half line width.

Invalid or unknown commands make the whole path uncovered; do not retain a valid prefix. CARC, Bezier, full circles, and coincident-endpoint arcs remain unsupported. Do not infer implicit closing edges from filled polygons; `closed` follows actual first/last nodes. Existing single-/multi-segment line output remains. All nearby items are bounding-box candidates; `confirmed` and overall `complete` remain false. Manufacturing parser separately discloses unsupported G02/G03; ARC support in the source channel does not mean manufacturing inspection is complete.

Twenty-five arc segments and 10 additional straight lines across five poses, local layers 3/4, were uniquely matched to manufacturing, including 90, -90, 180, 270, and -172.3719-degree mixed paths. Centers, direction, radius, sweep, and bounds matched within manufacturing quantization error and remained after save/reopen. The official 0.20.94 command returned 65 paths / 95 segments (including 25 arcs); all arc geometry, source, and bounds matched current Gerber comparison. After save/close/reopen, 190 design records, 49 footprint records, source channel, and candidates remained; two checks did not change data; `task=0`. One device had been moved before acceptance began; that move was not rolled back, and current manufacturing files were re-exported and checked. This was not a relaxed geometry tolerance. Reopening fixture separately omitted four default class-display values and added an empty-net default-length tolerance; these were listed separately, while other design data and all 49 footprint records remained.

## 0.20.95 Manufacturing Arcs and Rotated Solder-Mask Macro (Bounded Host Acceptance Passed)

The manufacturing channel of `pcb.checkSilkscreen` adds ordinary G02/G03 arc strokes for FSLA45 mm coordinates, G75 multi-quadrant mode, and circular C apertures. Direction and XY follow Gerber modal state. I/J must be explicit on the current record and decode as offsets from the start point; they are not inherited from the previous segment. Envelope includes actual segmented sagitta, endpoint radius difference, and numerical margin, and returns an approximate summary. Confirmed/candidate classification still uses inner/outer geometry bounds. Do not treat chords as arcs or report no conflict just because the lower bound is empty.

`maxEnvelopeErrorMil` is a compensation amount for the arc centerline model, including radius residual, chord sagitta, and numerical margin. It is used to shrink/expand a capsule radius; it does not include polygon approximation of the capsule's round cap and is not a total error bound for final ink polygon. Interpret final geometry by `inner` / `outer` containment.

The verified body RoundRect macro is handled as four real arcs, four edges, and a filled quadrilateral, including rotation; do not fit it to an axis-aligned rectangle. Only that exact macro definition is supported. Unknown macros, G74, region arcs, and GKO arcs remain uncovered; if a region contains unsupported arcs, omit the entire region outline rather than return a partial one.

The 65 paths / 95 segments accepted in the 0.20.94 source channel remain; manufacturing is still reported separately. Manufacturing parsing can be complete for its supported subset without proving complete source enumeration, exact fonts, or whole-board production acceptance. Official 0.20.95 command acceptance on EDA 4.1.78 parsed five manufacturing layers completely, including 25 arcs, and retained source-channel 65 paths / 95 segments. After save/close/reopen, 190 design records, 49 footprint records, source channel, and actual conflict geometry remained. Both checks retained three confirmed face/category summary items and one review-needed summary item; `task=0`; do not call the whole board passed. This fixture took about 20.2 / 21.6 seconds on host; do not substitute the ~1.47-second offline result for host timing. Existing unknowns such as rule inheritance do not become accepted because of this result.

## 0.20.96 Manufacturing Region Source-Location Aid (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` adds a separate `manufacturingSourceLocations` channel. For original manufacturing summary items and location boxes, it searches nearby same-side source objects and associates bucket, `conflictIndex`, and `areaIndex`. SDK objects retain actual IDs; footprint paths retain composite sources such as `componentId` / `footprintUuid` / `localPrimitiveId`. If no location box exists, return `unavailable` without guessing. Search radius is `minClearance + 0.01 mil`; disclose `searchMarginMil`. Candidate distance is `bboxDistanceToLocationMil`, not manufacturing distance.

Every located item is only a nearby-source candidate: one hit is `candidate`, multiple hits `ambiguous`, and zero hits or unavailable location is `unavailable`. Candidate `confirmed` always remains false; channel `complete` always remains false. `available` means only that the manufacturing summary array structure was readable, not complete manufacturing coverage; still check original `manufacturing.complete`. A unique bounding-box hit does not prove unique manufacturing contribution: a candidate may have been removed by clear, may not form final ink, or may be included only by an oversized bounding box. A multi-pad can be a nearby copper object on both sides; do not represent it as confirmed solder-mask-opening ownership. Manufacturing-location truncation flags remain; original manufacturing geometry, distance, and confirmation status do not change.

Original `confirmedConflicts` / `potentialConflicts` arrays summarize by side and category; counts are summary-item counts, not independent collision locations, and location boxes are not source-object pairs. Original `confirmedConflictCount` remains compatible and means confirmed summary count. Source POLYs outside layers 3/4 increment `excludedOutOfScopePolyCount`, the number of out-of-scope records after mapping to instances; invalid layers remain unsupported. Do not treat layer 48 outlines as unsupported silkscreen. 0.20.96 completed official instruction and save/close/reopen acceptance on EDA 4.1.78. Four location boxes had 1, 1, 2, and 1 candidates respectively; a summary without location returned unavailable. Candidate identities, bounds, and distances were checked. Source 65 paths / 95 segments remained; five nonsilkscreen POLY instance records were excluded correctly. 190 design records, footprint readback, and original manufacturing conflict geometry remained; background task count zero. Two checks took about 18.1 and 19.1 seconds. A single candidate still does not prove unique source; full B2 remains unaccepted.

## 0.20.97 Empty-Selector Default Trace Width (Bounded Host Acceptance Passed)

Shared parsing used by DSN export, SES-import width checks, and manufacturing-parameter comparison adds a strict empty-NET-selector branch for EDA 4.1.78. When a network belongs to a class but NET selector is empty, SDK network Track is default, and source identity, class relation, default, and class rules are confirmed, use global DEFAULT TRACK min/preferred/max, not class TRACK.

This branch currently supports mil, single-row enabled TRACK, enabled signal layers, and verified structure `ruleOrder=4`, `parent=null`, empty `ruleKeyValue` / `copperValue` / `innerPlaneValue`. Missing selector, explicit TRACK string `default`, extra fields, duplicate/conflicting records, other versions, and unconfirmed structures remain unknown. Callers need not supply rules the plugin can reliably read.

Independent host comparison changed default 5/10/100 to 22/27/38 mil. Native DRC clearly used 22–38 mil for the empty-selector network and DSN export was 27 mil; explicit class rule remained 25/30/35 mil. Results persisted after save/close/reopen. This does not prove the actual preferred width used during interactive routing or acceptance of boundary-equal values; `preferredMil` remains the source configured value for DSN comparison. DSN, import geometry, automatic writeback policy, and persistent-lock policy were unchanged. The official 0.20.97 command passed EDA 4.1.78 acceptance: DSN network 27/30 mil matched; structural default 27.05 versus preferred 27 remained separately reported. SES at 20/40 mil was rejected with zero writes, then 27 mil imported normally, without persistent lock. After save/close/reopen, all 175 `data` entries remained; `task=0`. Test-board DRC still had 13 issues; the new independent test track had a same-net connectivity report but no width violation. Do not call whole-board acceptance. `routingConstraintsComplete:false` remains.

## 0.20.98 Board-Edge Distance Witness (Bounded Host Acceptance Passed)

For an already reported silk-to-board-edge item, `pcb.checkSilkscreen` adds a verifiable distance location. Original distance bounds, `confirmed` / `potential`, and category counts remain. `locationKind` is `distance-witness`, `locationEnumerationComplete` is false, and `locationBoundsMil` only bounds the two witness points; zero area is allowed for a coincident point.

`locationWitness` states `distanceBound:lower`, `silkGeometry:outer-envelope`, and provides `silkPointMil`, `boardPointMil`, and `measuredDistanceMil`. `kind` distinguishes actual `intersection`, `contained-point` where the board-edge point lies inside final ink, and separated `nearest-points`. Use the final envelope after dark/clear processing; do not claim an exact original ink boundary or infer source primitive ownership. If zero is only within tolerance, preserve actual nearby-point distance instead of fabricating an intersection. If not verifiable, location remains unavailable.

Source-location channel propagates witness type and noncomplete-enumeration status, and still returns nearby bounding-box candidates only; `confirmed` remains false. One witness does not mean only one contact or coverage of every conflict; candidate bbox distance is not actual silkscreen-to-board-edge distance. Coverage of other manufacturing categories and Gerber formats is unchanged. 0.20.98 passed official instruction and save/close/reopen acceptance on EDA 4.1.78: board-edge witness `(1200,196.70061870274318)` mil matched independent geometry and associated one nearby source candidate. Three original confirmed summaries, one potential summary, and distance remained. 190 design records, footprint readback, and source candidates remained; `task=0`. One witness is not every contact location or unique attribution; full B2 remains unaccepted.

## 0.20.99 Silkscreen-Location Candidate Roles (Bounded Host Acceptance Passed)

`manufacturingSourceLocations` in `pcb.checkSilkscreen` adds `role` to original `candidates` and `roleGroups` to each location. Silkscreen text, designators, supported silkscreen primitives, and footprint strokes are `silkscreen-source`; nearby pads in a solder-mask category are `mask-opening-owner-candidate`.

`roleGroups.candidateIndices` point to original candidates; object identities are not duplicated. Each group returns `candidateCount` and `unavailable` / `candidate` / `ambiguous`. Missing candidates for a role do not mean no manufacturing risk. Board-edge and outside-board categories provide only the silkscreen group. Original flat status still aggregates all candidates; use `roleGroups` for role-specific location.

Pad candidates come from copper-object bounds, not confirmed solder-mask-opening ownership. One candidate in each group does not identify the actual conflicting object pair. `confirmed:false` and `complete:false` remain; original manufacturing decision, location, and distance remain. Candidate bbox distance is not actual spacing between candidates. This version passed official instruction and save/close/reopen acceptance on EDA 4.1.78: R2 designator and pad were separated into groups with one candidate each, original manufacturing determination remained, 190 design records and 49 valid footprint records remained, and task count was 0. Full B2 remains unaccepted.

## 0.20.100 Footprint-Arc and Board-Edge Participation Evidence (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` adds independent `footprintArcBoardParticipation`. Using same-run stable footprint source and exported Gerber, it checks intersections between supported single-segment footprint ARC centerlines and a simple straight board outline. It does not use bounding boxes or outer-envelope witnesses in place of source centerline intersections.

Same-side manufacturing arc must be a dark circular-aperture stroke, matching endpoints, center, radius, direction, sweep, and width. Quantization tolerance is derived from exported-coordinate precision. Disclose zero matches, multiple matches, or unreliable numeric values. Actual manufacturing primitive references locate items only in the same-run report; they are not EDA primitive IDs. Keep reliable source intersections separately in `sourceIntersectionPointsMil` even when manufacturing match is uncertain. `witnesses` are point-by-point contribution checks after a match; `contactEnumerationComplete` is false and unresolved contacts are disclosed with `unresolvedContactReason`.

When manufacturing contribution is `verified-at-witnesses`, the intersection must lie strictly inside the complete manufacturing lower bound and outside the upper bound after replaying in original polarity order with only the matched manufacturing primitive omitted. This proves necessary contribution by the matched manufacturing primitive at listed intersections only. `sourceMapping` is `geometry-correlated`; `uniqueSourceAttribution` always remains false. It does not mean Gerber contains a unique source identity or upgrade candidates to confirmed.

This channel handles only a verified subset, not text glyphs, complete width/spacing, or all silkscreen primitives. No intersection does not mean there is no line-width contact or other manufacturing risk. If unrelated solder-mask layer is incomplete, the complete same-side silkscreen layer can be checked separately against outline, but original `manufacturing.complete` remains. Budget errors follow existing failure behavior and cannot be treated as no conflict.

Original manufacturing decision, distance, role candidates, and completeness remain. Official instruction and save/close/reopen acceptance completed on EDA 4.1.78: among 20 single-segment arcs, the two source centerline/board-edge intersections for target e95 and matched manufacturing-arc contribution agreed with local verification. 190 design and 49 valid footprint records remained, task count zero. Original manufacturing decision, geometry locations, and candidate locations remained. Five aperture-definition parameter changes were separately saved; no evidence shows they were used in the same export, so the complete report is not claimed identical. Full B2 remains unaccepted.

## 0.20.101 Silkscreen and Mask Manufacturing-Participation Evidence (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` adds independent `manufacturingMaskOverlapParticipation`. Using same-run complete silkscreen and solder-mask layers, it adds strict interior witnesses to existing confirmed positive-area intersections. It checks only the already supported Gerber subset.

Choose a witness point from the true intersection of final lower bounds, then check interior membership and boundary margin in both layers. For each layer, list manufacturing references of dark primitives that may cover the point. Omit each coverage candidate individually and replay original polarity order. Only when a candidate's own lower bound contains the point, omitted final upper bound excludes it, and it is away from the boundary does it prove necessary contribution. Return `verified-at-witnesses` when exactly one necessary contributor on each side is proven. There may be multiple original coverage candidates; do not reject early based on raw candidate count when clear-then-redraw occurs.

Return a specific reason for no reliable interior point, repeated coverage, nonunique primitive, unconfirmed contribution, missing layer, or incomplete parsing. Propagate budget errors; do not treat them as no conflict. Inputs and original manufacturing results, source-location candidates, and arc-board participation report remain.

Manufacturing reference `layer`, `fileName`, `contentBytes`, and `shapeIndex` locate a primitive in the same export only; they are not EDA `primitiveId`. `uniqueSourceAttribution:false`. Source-role groups remain candidates; one candidate per group does not confirm actual EDA-object ownership. One interior witness does not mean all overlapping locations or all object pairs were enumerated.

This channel does not extend to text-glyph identity, effective pad-opening ownership, full width/spacing, or all formats. Official instruction and save/close/reopen acceptance passed on EDA 4.1.78: bottom-side witness and necessary contributions on both GBO23/GBS1 sides matched local verification; 190 design and 49 valid footprint records remained, task count 0. Original manufacturing geometry determination, source candidates, and arc channel remained; five aperture-definition parameter changes were still listed individually. Full B2 remains unaccepted.

Both sides' `witness.silk/mask` report `darkUpperCandidates`, `necessaryContributorCount`, and `necessaryContributorRefs`. `uniqueDarkCoverage` describes original coverage candidates only; final proof depends on `necessaryContribution`. When omitted upper is empty, `omittedFinalUpperEmpty=true` and boundary distance is null, meaning there is no boundary.

Interior-point search uses a finite set of candidates and does not guarantee finding all verifiable points. `not-verified` does not mean there is no verifiable manufacturing primitive pair.

## 0.20.102 Pad and Manufacturing Mask-Opening Geometry Association (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` adds independent `padMaskOpeningAssociations`. It associates stable footprint-source PADs, actual PAD_NET number/local ID, and runtime device pads to check manufacturing openings for ordinary single-sided SMD rectangles. If number or ownership is not unique, do not choose one arbitrarily.

Model uses source RECT with positive width/height, zero corner radius, and explicit positive solder expansion on target face. Center comes from actual high-precision copper bbox; orientation from actual rotation; recompute projected bbox from source dimensions and verify. Do not use coarse SDK coordinates/sizes for exact geometry or relax tolerance based on them. Nonempty PAD_NET `attrsMap`, recognized instance PAD overrides, special PADs, holes, and unexplained geometry correction return unsupported reasons; do not infer all host override mechanisms have been covered.

Same-run complete GTS/GBS dark RoundRect flashes must match center, four rectangle-core corners, and expansion radius. Core corners allow different start point, traversal direction, and equivalent rectangle representations; quantization tolerance derives from export format. `matches` reports `geometry-correlated`, `not-matched`, `ambiguous`, or `geometry-match-uncertain` separately, retaining actual `runtimePadId`, source identity, and all matching manufacturing references.

Link a witness only to the same-run opening reference whose necessary contribution has been proven by `manufacturingMaskOverlapParticipation`, and check that the same witness point lies inside predicted opening model. Before/after component-pad snapshots, PCB and footprint source must be stable; propagate budget errors. Inputs and original manufacturing, source-location, arc, and overlap reports remain.

Geometry correlation does not prove unique source; `uniqueSourceAttribution:false`, and original candidates remain `confirmed:false`. This model does not prove copper outline was uniquely recovered from bbox, nor text source or complete conflict-pair coverage. Formal instruction and save/close/reopen acceptance completed on EDA 4.1.78: pad-opening geometry associations for five poses / ten pads matched local verification; R2 pad 1 corresponded to GBS1 and linked original internal witness. All 190 design and 49 valid footprint records remained; task count zero. Original manufacturing geometry, source candidates, arc and overlap-participation reports remained; five aperture-definition changes were separately listed each time. Full B2 remains unaccepted.

Model retains source expansion values for both faces, selected source field, and actual face. It currently selects the same-named source field based on the instance's actual side; bottom-face local-face-flip semantics have not been independently verified. Manufacturing match proves only that the used numeric model matches this flash, not a general mapping rule for asymmetric expansion fields.

## 0.20.103 Local Top-Layer SMD Mask-Expansion Mapping (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` corrects expansion-field choice for bottom-side components in `padMaskOpeningAssociations`. For verified footprint local copper layer 1 and ordinary non-plated RECT SMDs, source `topSolderExpansion` follows the component's actual copper side. Top instances match GTS and bottom instances match GBS, both using source `topSolderExpansion`; do not switch to source `bottomSolderExpansion` merely because the actual face is bottom.

`sourcePadModel` retains both source expansion values and returns `localCopperLayerId=1`, `expansionMapping=local-layer1-follows-component-side`, `selectedExpansionField=topSolderExpansion`. Full center, rectangle-core corners, expansion radius, stable source, PAD_NET identity, precise copper bbox, and actual rotation checks remain. Remove the old same-name global-face-selection assumption within scope; `modelAssumptions` is an empty array.

Verified in isolated projects: source top/bottom 3/7 and 3/11 with only bottom source changed to 11; ten PADs across five poses on top/bottom used 3 mil expansion in all four initial/save-reopened Gerber outputs. Official EDA 4.1.78 acceptance completed for the original and isolated 3/7 and 3/11 projects; both asymmetric setups associated all ten pads, restored six bottom associations, and matched source-top expansion model to manufacturing. All 190 design / 49 valid footprint records remained during each check and save/reopen; task count zero. Original manufacturing geometry and other source channels remained; full B2 remains unaccepted. This does not explain general local/global getter semantics or cover multilayer, plated-through, special PADs, nonzero corner radius, or other shapes.

Local copper layer 2, multilayer, and missing/invalid source layer are explicitly `skipped`. Current conclusion does not interpret getter local/global semantics or extrapolate to unverified PAD paths. Original coverage, ambiguity, stability, and budget handling remain; `geometry-correlated` still does not prove unique source, `uniqueSourceAttribution:false`, original candidates are not upgraded, and full B2 is not passed.

## 0.20.104 Local Bottom-Layer SMD Opening Association (Bounded Host Acceptance Passed)

`padMaskOpeningAssociations` in `pcb.checkSilkscreen` adds ordinary, non-plated, NORMAL, zero-radius RECT SMDs on footprint-local copper layer 2. Local layer 1 still uses source `topSolderExpansion` and the PAD copper face must match the component side. Local layer 2 uses source `bottomSolderExpansion` and the PAD copper face must be opposite the component side. Strictly check component, local, and actual PAD layers; candidate side and GTS/GBS target use the verified actual PAD side.

`sourcePadModel` retains both source expansion values. Local layer 2 returns `localCopperLayerId=2`, `expansionMapping=local-layer2-opposite-component-side`, and `selectedExpansionField=bottomSolderExpansion`. Local layer 1 fields/values remain. Full center, core corners, radius, stable source, PAD_NET identity, precise copper bbox, and actual rotation checks remain; link only same-run manufacturing witnesses with proven presence, and do not fabricate old links when no witness exists.

Isolated projects with source top/bottom 3/7 and 3/11 changed only two PADs to local layer 2. Initial and save/reopen exports for ten PADs across five poses were GTS6/GBS4, with radii all 7 and 11 mil respectively. The new version passed formal instruction and save/close/reopen acceptance for the original and isolated local-layer-2 source 3/7 and 3/11 projects. Both local-layer-2 configurations associated all ten pads, six top and four bottom, matching source bottom 7/11 and actual manufacturing; with no overlap witness, both witness-reference sets were empty. All 190 design / 49 valid footprint records remained during checks and save/reopen; task count zero. Full B2 remains unaccepted. This evidence does not establish general local/global semantics of getter fields and does not cover multilayer, plated holes, special pads, nonzero corners, or other shapes.

Manufacturing-layer distance adds only conservative single-axis bounding-box lower-bound pruning. Retain overall intersection behavior, traversal order, exact segment distance, zero handling, and budget-error propagation. Full minimum-distance value and report meaning do not change, and are not truncated to the detection threshold. Offline speed does not replace host acceptance; host stage times are listed in `v104-final-audit.json` and apply only to this fixture.

Missing/invalid source layers, multilayer cases, and items that cannot be reliably matched continue to disclose `skipped` reasons. `geometry-correlated` still does not prove unique source identity; `uniqueSourceAttribution:false`; original candidates are not upgraded, and full B2 remains unaccepted.

## 0.20.105 Ordinary Circular SMD Opening Association (Bounded Host Acceptance Passed)

`padMaskOpeningAssociations` adds ordinary, non-plated NORMAL circular SMDs to `pcb.checkSilkscreen`. Source `defaultPad` must be ELLIPSE with finite positive width and height exactly equal; actual pad type must also be ELLIPSE. Retain local layer 1 source-top/component-same-side mapping and local layer 2 source-bottom/component-opposite-side mapping. Explicit positive expansion, PAD_NET identity, coverage, unique numbering, actual copper face, and readback-stability checks remain.

Use a separate circular model. `sourcePadModel` reports `shape=ELLIPSE`, `diameterMil`, and original layer/expansion source fields. Both axes of exact copper bbox must equal source diameter; center comes from exact bbox. Do not use coarse runtime getter size as source diameter. Rotation remains in snapshot stability checks; circle geometry does not depend on rotation. Do not require unrelated ELLIPSE `radius` to be zero; do not treat a truly unequal ellipse as a circle. Original RECT objects, four-corner core check, and full association output remain. Derived center, positive opening diameter, and four outside-boundary coordinates must be finite; report overflow as `skipped` without creating candidates.

Circular match requires same-side dark solid C flash with one positive parameter, matching complete center and opening diameter; opening diameter is copper diameter plus twice selected expansion. `geometryChecks` uses `circleOnly` and center/positive-diameter checks, not fabricated RoundRect corners. Original C diameter token is retained for traceability and format interpretation; do not loosen tolerance based on textual decimal places.

Circle-diameter quantization was independently verified: ideal source 0.968375 mm exported as 0.96838; 1.07823254 mm exported as 1.07823; initial and save/reopen results remained. For this export path, C diameter uses the verified five-decimal-mm nearest-rounding error bound: half quantization 0.000005 mm plus floating-point margin. This is independent of FS45 center-coordinate precision. 1, 1.0000, and 1.00000 use the same rule. On unverified grids, exact numeric matching is allowed only when consistent with pure floating-point scale in source model; otherwise preserve an unconfirmed-precision reason. Do not ignore an unresolved same-center candidate and thereby confirm another as unique.

Necessary contribution and witnesses still require a unique reliable geometric match, same side, exact manufacturing-reference match, confirmed necessary contribution, and point strictly inside the source opening circle. The eight real circular exports currently contain no mask-overlap witness; `witnessLinks` and `necessaryMaskReferences` should be empty, with no fabricated old link.

Four isolated copies covered source 3/7, 3/11, and two fractional diameters; initial/reopened exports all had ten PADs and GTS5/GBS5 checked individually. New version passed formal instruction and save/close/reopen acceptance for original rectangle project, circle 3/7 and 3/11, and a fractional-diameter round-down sample. Each circular copy had ten PAD associations, five top/five bottom, and fractional source diameter matched manufacturing rounding; when there was no mask-overlap witness both link types were empty. In all four projects, 190 design / 49 valid footprint records remained; task count zero. Non-grid exact-value fallback and abnormal-input handling are local regression evidence; host exports this round used verified five-decimal grid. Full B2 remains unaccepted. True ellipses, capsules, multilayer, plated holes, special overrides, and text sources remain uncovered; `geometry-correlated`, `uniqueSourceAttribution:false`, and `complete:false` remain.

## 0.20.109 B2 Capsules and Double-Sided Solder-Mask Openings (Bounded Host Acceptance Passed)

`pcb.checkSilkscreen` parameters are unchanged. 0.20.109 completed formal checks and save/reopen on EDA 4.1.78 across six projects: original RECT, unequal-axis ELLIPSE, ordinary OVAL, equal-axis OVAL, ordinary multilayer plated hole, and independent outer-layer SPECIAL. Twelve calls and 160 face associations matched real-data replay.

### Non-Plated OVAL and ELLIPSE Runtime Width Model

Non-plated NORMAL OVAL supports footprint-local layer 1/2. Match standard O aperture to capsule-axis geometry; for arbitrary rotation, match complete Oval macro. Check center, both local core endpoints, and diameter individually. Quantize each ADD parameter independently to five decimal places in millimeters; off-grid values require exact match only. If related parameter precision is unconfirmed, preserve uncertainty and do not use another candidate to confirm uniqueness. A zero-core-length OVAL matches the host's actual C circular aperture result; C/O/OVAL representations of identical geometry all participate in ambiguity and precision decisions.

Unequal-axis ELLIPSE retains source `height` for reporting, but EDA 4.1.78 runtime pads and manufacturing openings are circular based on width. Report `sourceHeightMil` and `shapeInterpretation=circle-width-based-runtime`. This is not mathematical ellipse support.

### Local Layer 12 Ordinary ROUND Hole with Openings on Both Faces

Support local-layer-12 pads with ordinary equal-width/height ROUND hole, PAD use NORMAL, and positive top/bottom expansion. Supported outer default shapes are circle, zero-radius RECT, and OVAL. A PAD may have candidates on both faces; choose expansion by `localSurface` and map to GTS/GBS after component flip.

Include SPECIAL only when one unique entry has `start=end=1|2`, covers the target outer layer, and matches that face's shape. Duplicate/range coverage, unknown shape/attribute, or PAD_NET geometry override remains `skipped`; do not guess geometry.

`runtimeBBoxModel=default-and-special-union` means the declared shapes whose SDK aggregate bounds were proven. Four-layer fixture immediate read and two-layer fixture immediate and save/reopen read all included default shape; this does not mean physical inner copper exists in the fixture. Source geometry for each face was matched separately to complete same-side Gerber.

Check exact tuple field-by-field using full `shapeState`; getter dimensions accept only exact source values or the explicitly observed source value rounded to 0.1 mil. Source geometry still uses source precision. When readable, before/after `Hole`, `SpecialPad`, hole offset, rotation, and plating information must also remain stable. `sourceDrillMetadata` records source hole, offset, relative angle, and plating only; it does not prove drill output or connectivity. Solder-mask geometry does not subtract holes.

### Evidence and Boundaries

Geometry associations remain `geometry-correlated`, `uniqueSourceAttribution=false`, and `complete=false`. Original BOX candidates remain `confirmed=false`. Manufacturing text outlines continue to be checked and source locations remain candidates; Gerber has no object IDs and public APIs have not proven export/readback of glyph outlines by object ID.

The 190 design / 49 valid footprint records remained in every read-only check this round. Six groups' valid data remained before and after save. Five non-geometric normalization differences for equal-axis OVAL relative to original import evidence are listed separately. Original project was restored and task count was 0.

Availability of each additional Hole/SpecialPad getter member was not separately observed; only stability of fields readable through the formal snapshot flow was confirmed this round, not drill validation. Cross-layer coverage, duplicate overrides, and unverified instance attributes remain explicitly uncovered. Unique text source is a confirmed limitation; manufacturing glyph checks and source candidates remain. Do not claim whole-board DRC, every font combination, or full B2 passed.

## 0.20.110 Remaining B2 Work (Partially Host-Accepted)

This section records tests and review of closed geometry, runtime expansion, and complex SPECIAL sources. Original 0.20.110 project and signed/closed/null isolated copies completed corresponding checks. After save/reopen across 14 projects and 28 rounds, 300 `geometry-correlated` faces and 60 closed-face checks remained. Range-inner A passed 8 face associations with nets at first check; 12 faces on 6 no-net PADs were not associated, although `manufacturing.complete=true`, `sourceStable=true`, and `rulesStable=true`. Original failed scene was retained; root cause is unknown. Original project was restored to 190/49; task count zero, no further upgrade. B2 was not fully accepted.

### Signed / Closed Manufacturing Geometry

Support R aperture or exact Rect macro where RECT `e` is zero or negative and remaining width/height positive. Rectangle width/height and angle must match as a pair; angles are equivalent modulo 180 degrees, with independent 0.01-degree grid and half-grid boundary of 0.005 degrees. C and OVAL are valid only if signed expansion leaves a positive radius.

For degenerate closed geometry, decide jointly from model prediction and observed final manufacturing paint in `source-copper-region`. Use only statuses `observed-no-positive-area-opening`, `unattributed-opening-present`, or `geometry-match-uncertain`; without a unique complete target Gerber layer use `not-evaluated`. Do not fabricate references when reliable object references are absent. Checks are read-only and compare getter expansion before and after.

Signed ZIP replay of 70 open and 30 closed samples passed. A 16-stage replay of 112 face records passed; these replays do not mean the official candidate instruction was host-accepted.

### R1: Runtime Effective Value for Null Expansion

R1 was implemented and expert-reviewed with no blockers. Only when source expansion is strictly `null`, use the finite valid value from the same PAD's runtime physical face, retaining source `null` and source `runtime-effective`. `undefined`, read error, or nonfinite value is unknown. When explicit source value and runtime value conflict, return `overrideNeeded` and continue manufacturing geometry channel.

The ordinary null-expansion path was tested successfully in the original project; this does not mean the empty-net API return has been established.

### R2: Complex Sources and Duplicate Layer Keys

R2 two-path adaptation was implemented. First path applies to complex source declarations where SDK layer keys are unique and exactly `[1,1]`, `[12,12]`, or `[2,2]`: recover exact values from a unique source using three-shape normalization. 0.1 mil rounding applies only to verified SDK shape getter values, not source-dimension precision. Identical multiple sources may normalize; reject association when exact source values are not unique or rounding collides.

Second path applies to complex source declarations with duplicate SDK layer keys. Through host-evidenced `pcb_Net.getAllPrimitivesByNet`, read raw data for the same PAD's runtime net. Require unique match of string `globalIndex` and runtime PAD ID and also match `parentId`, `layerId=12`, `pcbItemPrimitiveType='Pad'`, and `net`. Missing, duplicate, or any field mismatch remains unknown; do not guess first/last item or source precedence.

Raw named `top`/`bottom` means runtime physical face; `inner` contributes only to joint bbox and its index is not interpreted as a copper-layer ID. Build geometry using raw width/height × 10 mil and match source at full precision only, without 0.1 mil rounding. Only `ratio=0` and each `inner` item `pl=null` are usable; other values remain unknown. Normalization of the 1/12/2 values is not overridden by raw.

Recheck original `SpecialPad` and consumed raw fields before and after export. On failure, preserve unknown. Report every source declaration and candidate index; do not interpret general range or “last entry wins” semantics.

Large OVAL 80×60 tests with SPECIAL ranges 1..15 and 2..16 confirmed inner participates in joint bbox while outer layer remains default shape. This conclusion describes the SDK aggregate model for those two settings only and is not generalized to every range.

### Save/Reopen and Regression Evidence

Six SPECIAL projects and one inheritance control remained after save/reopen with raw values, bbox, actual solder mask, and 49 footprint records. Each SPECIAL project had 190 records and five non-geometric normalization differences; design geometry remained. Inheritance project had 191 records and no differences. The measured 0.20.110 scope remains limited; 0.20.111's real-host empty-net query returned an empty array, but association for no-net pads still did not pass. The main agent later completed 28 save/reopen rounds across 14 projects; 300 `geometry-correlated` faces and 60 closed-face checks remained.

Sixteen-stage replay of 112 faces, signed ZIP replay of 70 open / 30 closed samples, 15 related regressions, and 43 command tests passed. These are local replay/automated tests; host results for 0.20.110 remain partially passed only for tested paths and B2 is not fully complete.

### Uncovered Scope

No-net root cause is unknown. Possible causes include SDK empty result, network `null` / missing, or another schema difference; the 0.20.110 failure report did not disclose the exact stage, and current `getNetPrimitives` rejects empty-string network value. Do not assign a root cause based on this. The user confirmed retaining the source-association limitation for instance geometry and mask coverage; manufacturing-geometry checks continue, but unknown source association does not mean instance coverage was accepted. Continue applying source-attribution, completeness, and whole-board DRC boundaries from [0.20.109 details](#020109-b2-capsules-and-double-sided-solder-mask-openings-bounded-host-acceptance-passed).

## 0.20.111 Historical Host Record for Empty-Net Query (Failed Then; Addressed by 0.20.112)

In 0.20.111, connection `instanceId` was `afcca83d`. For range-inner A, `pcb.getNetPrimitives({net:""})` returned `ok:true` and an empty array; `+5V` returned two raw PADs. Formal check associated 8/20 faces; 6 no-net PADs / 12 faces were unassociated. Historical evidence: `evidence/v111-host-rangeA-empty-net.json`, `v111-host-rangeA-power-net.json`, and `v111-host-rangeA-check.json`. This was the state at 111; see next section for 112 acceptance.

## 0.20.112 B2 Empty-Net DSN Adaptation (Host Acceptance Passed)

### Command Behavior and Return Fields

`pcb.checkSilkscreen` parameters are unchanged. Only when the empty-net supplemental read succeeds with an empty array and target runtime ID match count is zero does the plugin read native DSN as needed. Before/after DSN text, design source, rules, and runtime snapshot must be stable. DSN read failure or change preserves source association as unknown; manufacturing inspection continues and retains its own results.

Source identity comes from valid `PAD_NET`, current footprint PAD, and actual runtime PAD binding. Verified canonical `eN` local-ID conversion must have no global collision. DSN pin instance is unique and its stack reference resolves to one definition. Shared stack itself is allowed. Current adapter handles flattened placements with one image `u1`, zero translation, front side, zero rotation; pin coordinates are independently checked against exact runtime copper-bounds center.

DSN independently selects physical top/bottom shape only. Check full C diameter, RECT corners, and OVAL complete n12/n13 semicircle sequence respectively; exported values must be on a 0.01 mil grid with error no more than 0.005 mil plus floating-point margin. Polygon `0.1` recognizes only the verified serialization pattern; it is not used to expand copper shape and exported polygons are not treated as exact copper outlines. If multiple full-precision source shapes explain the same output, remain unknown; do not select source by Gerber.

Recover the copper bounds from the union of all SDK-returned SPECIAL tuples after restoring a unique complete-precision source shape. Ignore physical-face meaning of duplicate layer keys and do not add an old declaration that was overridden and not returned. DSN inner data is incomplete and does not participate in this bounds decision. Manufacturing opening remains independently matched against same-run Gerber.

Top-level `nativeDsnOuterSelection` returns `requested`, `status`, `stable`, and `reason` when unavailable. `sourcePadModel.dsnPhysicalView` records physical top/bottom selection, source identity, and DSN details, including `method=native-dsn-outer-shape-selection`, `evidence=dsn-export-derived`, export version, pin/stack, complete mode, and quantization. `runtimeBBoxModel=dsn-outer-and-runtime-special-union` denotes the above SDK full-tuple bounds model. Original empty-net query failure detail remains in `rawQueryFailure`. Geometry correlation still does not mean unique source attribution.

### Formal Checks on Six Projects

The user imported 0.20.112; `instanceId` was `61dc5f59`. Six projects each completed initial and save/reopen checks: 12 formal checks total, 220 checked faces cumulatively. The 220 includes repeated reopen checks and is not 220 unique faces. Every check had manufacturing complete, source/rules stable, and `task=0`.

| Project | Initial associated / DSN-derived faces | Time | Reopened associated / DSN-derived faces | Time |
|---|---:|---:|---:|---:|
| original | 10/10 / 0 | 11,298 ms | 10/10 / 0 | 14,180 ms |
| rangeinnerA | 20/20 / 12 | 18,202 ms | 20/20 / 12 | 16,970 ms |
| rangeinnerB | 20/20 / 12 | 20,081 ms | 20/20 / 12 | 18,261 ms |
| overlapfirst | 20/20 / 0 | 10,800 ms | 20/20 / 0 | 7,471 ms |
| overlaplast | 20/20 / 0 | 11,998 ms | 20/20 / 0 | 13,189 ms |
| dsncomplex | 20/20 / 12 | 22,246 ms | 20/20 / 12 | 24,147 ms |

Completed 72 DSN-derived empty-net face associations. DSN pattern face checks: circle 36, RECT corners 24, OVAL semicircle `n13` 12. Final selector replay also recorded horizontal 20, vertical 20, quantization 15, collision 10, 65 selections total. Fifteen faces that precision cannot distinguish remain intentionally unknown. Shared stack itself is allowed; retain unknown only for missing/duplicate/colliding identity or indistinguishable precision.

### Persistence and Source Model

After save/close/reopen for all six projects, geometry model and manufacturing references matched strictly; all 49 valid footprint records per project remained field-by-field. Five projects other than `dsncomplex` had no changes to 190 design records. `dsncomplex` had five verified normalizations: four omitted `PRIMITIVE display:true` fields and one explicit empty-net default `NET_LENGTH_TOLERANCE` rule selector. Other compared geometry and associations remained; do not describe all source bytes or all `data` as bit-for-bit unchanged.

Original project was finally restored to 190 design records / 49 valid footprint records, `task=0`. Restoration evidence is `evidence/v112-final-restoration.json`; persistence details are in `evidence/v112-host-persistence-detail.json`.

### Local and Model Comparison

Seventeen regression groups, 57 instruction tests, TypeScript check, build, and expert review passed. Fixture P2 was closed; fixed fixture is in repository and its hash remained. Sixty-five DSN shapes matched the 111-era official manufacturing model comparison; this comparison alone does not prove the new adapter passed.

Package was imported: unified package 6,190,492 bytes, 72 files, SHA256 `87d38869a23ca149884a558acbe264db2416efe428eeb7947b4858fbbe58ea65`. 0.20.111 was archived as historical; frozen 112 package was not rebuilt. `dsnfaces`, `quant`, and `collision` controls each had two consecutive native DSN exports with stable bytes and source. `faces` and `quant` had stable DSN bytes after save/close/reopen; do not expand this to claim all four controls completed reopen.

B2 R1-R6 development and acceptance were completed this round. This conclusion covers only tested projects, DSN structure, and user-confirmed scope; it does not represent arbitrary input, complete PAD source enumeration, unique source-object location, or whole-board production acceptance. Instance-geometry/mask-coverage source-association and unique text-source limitations remain by the user's confirmed decision. `wholeBoardProductionAccepted=false` remains.

## 0.20.113 Concentrated Development Candidate (Source and Regression Passed; Awaiting Installation Acceptance)

The following retains the pre-installation candidate record for 0.20.113; bounded host results after installation are at the end of this section.

### `pcb.checkManufacturingProfile` Physical-Layer Evidence

Added `physicalLayerEvidence` with strict checks for valid records, tombstones, record identity, and duplicate `zIndex`. Return retains `rawPhysicalLayerRecords` and `thicknessRaw`. If units are unclear, return unknown; if ordering conflicts, retain unknown and do not generate a fake `orderedLayers`. This is read-only and does not save the project.

### SES Violation and Unknown State

When a single SES check finds both a definite violation and unknown items, overall status is `violation` and import is rejected before writing. Return retains `unknowns` string array and `violations`. When only unknowns exist, current import semantics remain unchanged and do not persistently lock later imports.

## 0.20.113 Bounded Host Acceptance (2026-10-26)

0.20.113 was installed. Formal read returned 13 effective physical layers; raw thickness and duplicate layer order explicitly remained unknown. Independent-project circle/RECT branch, known out-of-range SES rejection, subsequent valid import, and explicit same-source DSN/service/SES import passed bounded acceptance. Added 12 tracks and 3 vias; after reopen, all 203 records and full SES geometry of 21 tracks / 4 vias remained. Target eight-object immediate and reopened DRC both had zero. Whole board still had 10 errors; do not call it passed. Mixed violation+unknown branch passed local regression only; host normalized the controlled selector and did not produce that counterexample. Thickness conversion, complex inheritance, and actual production acceptance remain pending.

In independent project `ACE_B456_V113_ACCEPT_20261026`, the four PADs and four LINEs of the branch had a clearly nonempty target set. All 188 valid pre-import data remained; import added 12 LINEs and 3 VIAs. Raw service output, official retrieval, and saved SES were all 3,260 bytes and byte-for-byte identical. The complete SES matched reopened source geometry for 21 LINEs and 4 VIAs within 0.001 mil. Caller explicitly supplied 12 mil drill; it was not inferred from SES. After save/reopen, only four class display settings omitted `display:true`; visual equivalence was not checked separately.

40 mil, outside known +5V range 25–35 mil, was rejected before writing with valid source records unchanged; a valid 30 mil request immediately succeeded on the same copy and passed save/reopen. Host normalized controlled ACE_VIA `ruleOrder:5` to 4, so this input does not prove the mixed-unknown host branch. No repeated probing of other values was performed and complex inheritance support was not expanded.

Frozen official development sample formally returned `overall=incomplete`; units, real physical stackup, unverified calculations, and missing order were not promoted to pass. Structural DSN default width 27.05 mil versus EDA preferred 27 mil remains explicitly reported and within 22–38 mil; valid preferred widths for each network, 27 / 30 mil, matched without silent rewriting. Routing service completion is not EDA whole-board connectivity. Immediate and reopened whole-board DRC still had 4 width and 6 connection errors; target P/N check had zero items.

After restoring original project `ACE_B2_ARC_FORMAT_20261023`, all 190 valid records remained; `task=0`; test modifications were not saved. Independent test service has exited. Frozen 0.20.113 package was not rebuilt; installation and persistence conclusions apply only to the inputs above.

# Net Classes, Differential Pairs, and Manufacturing Exports (PCB)

> The tables on this page preserve use cases and limitations. Use `/help?cmd=<command-name>` for parameters, return fields, and examples, for the confirmed version of the selected window.
> A `/command` request must include `cmd`, top-level `instanceId`, and the required `params` in the outer request.
> A macro routes only the outer request; steps inherit the instance.
> See [setup](setup.md) for complete examples.

This page describes network constraints and manufacturing exports.

## Net Classes and Differential Pairs

| Command | Purpose | When to use | Limitation |
| --- | --- | --- | --- |
| `pcb.createNetClass` | Create a net class (apply rules/colors consistently to a group of nets) | When managing rules by net group. | If the write outcome is unknown, stop further writes. |
| `pcb.listNetClasses` | List net classes | When managing rules by net group. | Confirm available parameters using help for the target instance. |
| `pcb.deleteNetClass` | Delete a net class | When managing rules by net group. | Confirm the target and make a backup first. |
| `pcb.renameNetClass` | Rename a net class | When managing rules by net group. | If the write outcome is unknown, stop further writes. |
| `pcb.addNetToClass` / `removeNetFromClass` | Add or remove a net-class member | When managing rules by net group. | Confirm the target and make a backup first. |
| `pcb.createDiffPair` | Create a differential pair (such as USB D+/D-) | When configuring or checking differential signals. | If the write outcome is unknown, stop further writes. |
| `pcb.listDiffPairs` / `deleteDiffPair` | List or delete differential pairs | When configuring or checking differential signals. | Confirm the target and make a backup first. |
| `pcb.getNetRules` | Read net rules in the current design rules (trace width/spacing, etc.; **read-only**—the write interface is not exposed because its structure is complex) | When checking current trace-width and spacing rules. | Reads rules only; does not provide a rule-writing operation. |
| `pcb.getNetLength` | Total routed length of a net (for equal-length checks) | When comparing actual routed lengths. | Confirm available parameters using help for the target instance. |
| `pcb.getNetInfo` / `getNetPrimitives` | Detailed net information / all primitives on a net (tracks/vias/pads) | When analyzing connected objects on a specified net. | Confirm available parameters using help for the target instance. |
| `pcb.highlightNet` | Highlight or unhighlight a net (for troubleshooting) | When locating objects or troubleshooting connections. | Confirm available parameters using help for the target instance. |

## Selection and Cross-Probing

| Command | Purpose | When to use | Limitation |
| --- | --- | --- | --- |
| `pcb.select` / `pcb.clearSelection` / `pcb.getSelection` | Select by ID, clear selection, or read current selection | When reading or changing the current selection. | Confirm available parameters using help for the target instance. |
| `pcb.crossProbe` | Cross-probe: locate designators/pins/nets between schematic and PCB (highlight and select) | When locating objects or troubleshooting connections. | Confirm available parameters using help for the target instance. |

## Schematic No-Connects, Attributes, and Images

| Command | Purpose | When to use | Limitation |
| --- | --- | --- | --- |
| `schematic.setPinNoConnect` | Add or remove an X no-connect marker on a pin (clear floating-pin DRC warnings) | When marking a legally unconnected pin. | A pin marked NC cannot be wired further. |
| `schematic.getAttributes` / `setAttribute` | Read or change primitive attributes (keys such as Designator/Value/Footprint) | When checking or updating an existing primitive attribute. | Can modify existing primitive attributes only. |
| `schematic.getSelection` | Read currently selected primitives | When reading or changing the current selection. | Confirm available parameters using help for the target instance. |
| `schematic.exportBom` | Export a BOM (xlsx/csv, base64) | For backup, delivery, or independent review. | Successful export does not mean the contents have passed acceptance. |
| `schematic.exportPng` | Export schematic PNG (maximum 4096 px on one side) | For backup, delivery, or independent review. | Neither side may exceed 4096 px. |
| `schematic.listNets` | List all schematic nets (`detail:true` includes attributable wire details) | When checking the scope of existing nets. | On EDA 4.1, automatically generated net wires may not be attributable; verify with the netlist. Confirm available parameters using help for the target instance. |

## Manufacturing Exports (Save the Base64 Data Locally)

| Command | Purpose | When to use | Limitation |
| --- | --- | --- | --- |
| `pcb.exportGerber` | Gerber board-manufacturing files (usually zip) | For backup, delivery, or independent review. | Successful export does not mean the contents have passed acceptance. |
| `pcb.exportPickPlace` | Pick-and-place coordinates | For backup, delivery, or independent review. | Successful export does not mean the contents have passed acceptance. |
| `pcb.exportDsn` | Specctra DSN (first step for external autorouting: `exportDsn` → external router → import with `importAutoRouteSes`). In the v0.20.60 installed build, instance `e12f68c0`, PCB2 export had slot-hole clearance 11.811 mil and two Inner1 filled planes with `warnings:[]`; DSN bytes matched after save/reopen. | When handing off to an external autorouter; if filename is omitted, `board` is used. | Acceptance covers only that project/export sample. v0.20.61/.62 added no PCB export behavior or host acceptance. In the official FreeRouting JAR 2.5.0 probe, 8 mil had a target violation and 12.5 mil added no probe violation; preset board violations remained and SES was not imported. This does not mean whole-board DRC or routing passed. Compensation may make some vias/pads stricter; `planeSlotEquivalent:false` and `routingConstraintsComplete:false`. See [PCB workflow](commands-pcb.md) for exact comparison scope. Inspect export contents after export. Successful export does not mean content acceptance. |
| `pcb.exportNetlist` | PCB netlist.<br>Since v0.10.104, rejects zero-byte files and empty base64; parse and check the export anyway. | For backup, delivery, or independent review. | Since v0.10.104, rejects zero-byte files and empty base64; parse and check the export anyway. |
