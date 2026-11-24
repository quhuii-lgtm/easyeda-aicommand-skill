# Reconcile Uncertain Writes and Split or Merged Routes

1. Verify project, page and object identity. Back up before local rerouting or edits that affect accepted work. Capture nets, layers, endpoints, traces, vias and key contacts.
2. On timeout, partial failure or an incomplete reply, stop dependent writes. Check the original task and read the actual document. Preserve the state if the task may still be running or its outcome remains unknown. Do not replay the batch.
3. Compare the path by net, layer, endpoints, width, junctions and copper coverage. Check splits at T-junctions, host merges, branches, layer transitions and pad contacts. Count an existing wider trace as reused only if it covers the route and meets the applicable rules.
4. Report ID changes separately after saving, reopening or exporting. If a via getter rounds a dimension, verify against effective source for the same board, object and unit. Retain both values.
5. Record created, reused, split, merged, missing and unconfirmed items. Patch only proven missing geometry in scope after the original task finishes. Otherwise preserve the state or use a verified recovery method.

Use `pcb.listLines`, `pcb.listVias` and `project.getDocumentSource` where available. Use `pcb.reviewLocalRouting` for supported local checks. Check coverage in command help and derive classifications from actual evidence where unavailable. For schematics, compare actual pins, shared branches and the pin-to-net map.
