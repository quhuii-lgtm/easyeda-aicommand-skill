---
name: ai-command-engine
description: Query, draw, edit, and inspect schematics, PCBs, projects, and component libraries in JLCEDA Professional through the local HTTP command proxy. Use extension-dev-skill for plugin development and debugging.
---

# AI Command Engine

Operate JLCEDA Professional through the local command proxy. Send structured commands; do not write ad hoc `eda.*` scripts.

## Schematic Drawing Is Required

Before the first schematic write, read [Schematic Requirements](references/原理图操作要求.md) and [Schematic Workflow](references/commands-schematic.md) in full. Do not start drawing from the command index alone.

- Follow this order: draw functional-area boxes and titles → place components and read actual pins → wire one area at a time → check each area → inspect and save the whole page.
- Every new functional area must have an actual box and title. Edit existing drawings only within the authorized scope.
- Directly connect nearby pins on the same net within an area, including GND. Do not replace these connections with one label per pin for convenience.
- Use the unified [Schematic Completion Checks](references/原理图操作要求.md#schematic-completion-checks). Report electrical connectivity and visual layout separately. For whole-schematic delivery, save, reopen, and read back. Do not report unchecked items as passing.

## PCB Operations Are Required

Before the first PCB write, read [PCB Requirements](references/PCB操作要求.md) and [PCB Workflow](references/commands-pcb.md) in full. Do not start from the command index alone.

- Follow this order: inspect current state and design conditions → mechanical setup, layers, and rules → place components by actual pads → check routability → route critical and ordinary nets → create actual copper pours and silkscreen → run DRC and applicable manufacturing checks → save for delivery.
- Base placement on real pads, critical loops, and return paths. Default macro placement does not prove layout quality.
- When conditions are met, offer optional grouping or autorouting per [Optional Tools and When to Offer Them](references/PCB操作要求.md#pcb-optional-tools) and ask before using. Reuse an explicit prior choice without asking again.
- Report methods, conclusions, evidence, and omissions for each item in [PCB Completion Checks](references/PCB操作要求.md#pcb-completion-checks). Zero DRC errors, a copper outline, or a completed routing service does not replace board acceptance.
- For local tasks, change only the authorized scope. Do not force a full-board manufacturing handoff or report unchecked items as passing.

## Getting Started

1. Follow [Connection and Environment](references/setup.md) to check the service, instance, and current project.
2. Query command help for the target plugin version and use the parameters it returns.
3. Before drawing or editing, read the relevant operation requirements and workflow. For read-only inspection, drawing guides are not required.

## Execution Requirements

- Specify `instanceId` in every request and verify the project and target document. Only one actor may write to a given document at a time.
- `__docUuid` is an optional target-page check; it does not switch pages. Open the page first if it is not active.
- After a write, verify the returned objects and properties. To confirm persistence, save, close and reopen, then read back.
- A timeout does not mean the SDK cancelled the operation. If the result is unknown, stop dependent work, check the task and actual content, and do not resend blindly.
- Do not treat `unknown`, `incomplete`, uncovered objects, or candidates in a read-only report as a passing check.
- Evaluate DRC, geometry readback, and manufacturing parameters separately. A successful command does not prove the whole board or production is acceptable.
- Check the installed version, interface capability, and known issues from the current connection and its help. Local source does not prove what is installed.

## Find Guidance by Task

| Task | Open directly |
| --- | --- |
| Connection, window selection, units, timeout recovery | [Connection and Environment](references/setup.md) |
| Find command categories | [Command Categories](references/commands-frequency.md) |
| Draw or edit a schematic | [Schematic Requirements](references/原理图操作要求.md), [Schematic Workflow](references/commands-schematic.md) |
| Schematic command index | [High-Frequency Schematic Commands](references/commands-schematic-high.md), [Low-Frequency Schematic Commands](references/commands-schematic-low.md) |
| PCB placement, routing, pours, and checks | [PCB Requirements](references/PCB操作要求.md), [PCB Workflow](references/commands-pcb.md) |
| PCB command index | [High-Frequency PCB Commands](references/commands-pcb-high.md), [Low-Frequency PCB Commands](references/commands-pcb-low.md) |
| Fanout, differential pairs, length tuning, manufacturing checks, autorouter parameters | [PCB Topics](references/commands-pcb-special.md) |
| Projects, boards, sheets, and backups | [Project and Sheet Commands](references/commands-project.md) |
| Query or maintain symbols, footprints, and devices | [Library Commands](references/commands-lib.md) |
| Rule knowledge, trace-width estimates, and parts queries | [Knowledge and Parts](references/commands-knowledge.md) |
| Fabrication outputs, BOM, and coordinate files | [Manufacturing File Requirements](references/生产文件操作要求.md) |
| Properties, labels, netlists, and save issues | [Operational Risks](references/pitfalls.md) |
| Prepare and submit plugin issues | [Issue Reporting](references/issue-reporting.md) |
| Develop or review plugin commands | [Extension Development Requirements](references/插件开发要求.md); use extension-dev-skill for SDK information and debugging |
