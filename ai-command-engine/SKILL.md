---
name: ai-command-engine
description: Query, draw, edit, and inspect schematics, PCBs, projects, and component libraries in JLCEDA Professional through the local HTTP command proxy. Use extension-dev-skill for plugin development and debugging.
---

# AI Command Engine

Operate JLCEDA Professional through the local command proxy. Send structured commands; do not write ad hoc `eda.*` scripts.

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
