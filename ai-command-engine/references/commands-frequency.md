# Command Index by Task

This is a task-based navigation aid, not usage statistics or a verification status. Check parameters with `/help?cmd=<command>` in the target window. Read only the references relevant to the current task.

| Area | Common entry points | Task-specific commands | Reference |
| --- | --- | --- | --- |
| Project and pages | `project.getInfo`, `project.list`, `project.open`, `project.getInfoOf`, `project.exportFile`, `project.importFile`, `project.listSchematicPages`, `project.listPcbs` | `project.getBoardInfo`, `project.associateBoard`, `project.create`, `project.moveToFolder`, `project.getDocumentSource`, `project.createSchematic`, `project.createSchematicPage`, `project.deleteSchematicPage`, `project.copySchematicPage`, `project.renameSchematicPage`, `project.reorderSchematicPages`, `project.modifyTitleBlock`, `project.createPcb`, `project.copyPcb`, `project.deletePcb`, `project.copyBoard`, `project.deleteBoard`, `project.renameBoard` | [Project and page commands](commands-project.md) |
| Device lookup | `library.searchDevice`, `library.getDeviceByLcsc` | — | [Library commands](commands-lib.md) |
| Library management | `lib.symbolSearch`, `lib.symbolGet`, `lib.footprintSearch`, `lib.footprintGet`, `lib.deviceSearch`, `lib.deviceGet`, `lib.deviceGetByLcscIds` | `lib.symbolCreate`, `lib.symbolUpdateSource`, `lib.symbolCopy`, `lib.symbolModify`, `lib.symbolDelete`, `lib.symbolOpenInEditor`, `lib.footprintOpenInEditor`, `lib.footprintCreate`, `lib.footprintGetSource`, `lib.footprintUpdateSource`, `lib.footprintCopy`, `lib.footprintModify`, `lib.footprintDelete`, `lib.deviceCreate`, `lib.deviceCopy`, `lib.deviceModify`, `lib.deviceDelete` | [Library commands](commands-lib.md) |
| Editor | `editor.openDocument`, `editor.closeDocument`, `editor.screenshot`, `editor.listTabs` | `editor.zoomToAll`, `editor.zoomToRegion` | [Connection and setup](setup.md) |
| Design rules | `knowledge.query` | `knowledge.listRules`, `knowledge.widthForCurrent` | [Knowledge and parts](commands-knowledge.md) |
| Long-task recovery | `task.get`, `task.list` | — | [Troubleshooting](pitfalls.md) |

For schematic and PCB commands, use the [schematic high-frequency index](commands-schematic-high.md), [schematic task guide](commands-schematic.md), [PCB high-frequency index](commands-pcb-high.md), and [PCB task index](commands-pcb-low.md).
