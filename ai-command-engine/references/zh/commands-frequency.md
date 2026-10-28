# 指令使用频率分类

本页按常见任务提供优先入口，不是实际调用次数统计，也不表示指令是否可用或已验收。参数以当前目标窗口的 `/help?cmd=<命令名>` 为准。

原理图命令见[高频索引](commands-schematic-high.md)和[低频索引](commands-schematic-low.md)；PCB 命令见[高频索引](commands-pcb-high.md)和[低频索引](commands-pcb-low.md)。其余命令按任务分类如下。

| 范围 | 常见任务入口 | 特定任务入口 | 详细说明 |
| --- | --- | --- | --- |
| 工程与图页 | `project.getInfo`、`project.list`、`project.open`、`project.getInfoOf`、`project.exportFile`、`project.importFile`、`project.listSchematicPages`、`project.listPcbs` | `project.getBoardInfo`、`project.associateBoard`、`project.create`、`project.moveToFolder`、`project.getDocumentSource`、`project.createSchematic`、`project.createSchematicPage`、`project.deleteSchematicPage`、`project.copySchematicPage`、`project.renameSchematicPage`、`project.reorderSchematicPages`、`project.modifyTitleBlock`、`project.createPcb`、`project.copyPcb`、`project.deletePcb`、`project.copyBoard`、`project.deleteBoard`、`project.renameBoard` | [工程与图页指令](commands-project.md) |
| 简易器件查询 | `library.searchDevice`、`library.getDeviceByLcsc` | — | [器件库指令](commands-lib.md) |
| 器件库管理 | `lib.symbolSearch`、`lib.symbolGet`、`lib.footprintSearch`、`lib.footprintGet`、`lib.deviceSearch`、`lib.deviceGet`、`lib.deviceGetByLcscIds` | `lib.symbolCreate`、`lib.symbolUpdateSource`、`lib.symbolCopy`、`lib.symbolModify`、`lib.symbolDelete`、`lib.symbolOpenInEditor`、`lib.footprintOpenInEditor`、`lib.footprintCreate`、`lib.footprintGetSource`、`lib.footprintUpdateSource`、`lib.footprintCopy`、`lib.footprintModify`、`lib.footprintDelete`、`lib.deviceCreate`、`lib.deviceCopy`、`lib.deviceModify`、`lib.deviceDelete` | [器件库指令](commands-lib.md) |
| 编辑器 | `editor.openDocument`、`editor.closeDocument`、`editor.screenshot`、`editor.listTabs` | `editor.zoomToAll`、`editor.zoomToRegion` | [连接与环境](setup.md) |
| 知识规则 | `knowledge.query` | `knowledge.listRules`、`knowledge.widthForCurrent` | [知识与物料指令](commands-knowledge.md) |
| 长任务恢复 | `task.get`、`task.list` | — | [问题排查](pitfalls.md) |

工程、器件库和编辑器命令只在对应任务中读取；优先入口不表示每次都要执行。
