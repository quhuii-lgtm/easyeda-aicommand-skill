# 原理图低频指令

本页按特定任务索引，不表示命令无用或未经验证。先用当前窗口的 `GET /help?cmd=<命令名>` 核对参数；具体操作与写入限制见[原理图流程](commands-schematic.md)。

| 任务 | 指令 | 用途 |
| --- | --- | --- |
| 区域与定位 | `schematic.listRects`、`schematic.modifyRect`、`schematic.checkRectOverlap`、`schematic.placeRegion`、`schematic.getComponentsInRect`、`schematic.getPrimitivesInRegion`、`schematic.getPrimitiveAtPoint`、`schematic.getSelection` | 查询或修改功能区，按区域、坐标或选择定位图元。 |
| 结构创建与诊断 | `schematic.buildBlock`、`schematic.getPlacementResourcesDiagnostic`、`schematic.connectPin`、`schematic.setPinNoConnect` | 创建功能区，检查放置资源，连接引脚或标记未连接。 |
| 网络与标签修复 | `schematic.setWireNet`、`schematic.modifyWire`、`schematic.dedupeWireNets`、`schematic.repairNet`、`schematic.listNetLabels`、`schematic.pruneFloatingLabels`、`schematic.fixNetLabels`、`schematic.modifyNetLabel`、`schematic.moveLabel` | 核对或修复导线网络和标签；先读目标对象，写入结果不明时停止并核对图面及网表。 |
| 布局与检查 | `schematic.autoLayout`、`schematic.structuralAudit`、`schematic.runDrcDetailed` | 预览或调整布局、检查结构并读取详细 DRC。 |
| 属性、文字与删除 | `schematic.getAttributes`、`schematic.delete`、`schematic.placeText`、`schematic.listTexts`、`schematic.modifyText` | 查询属性、放置或查询文字，或删除指定对象。 |
| 导出 | `schematic.exportBom`、`schematic.exportNetlist` | 导出 BOM 或网表。 |

`schematic.modifyWire` 修改样式时，先核对目标线的网络与需要保留的样式字段；详细参数和检查要求见原理图流程。修复命令先确认目标对象并查看是否支持 `dryRun`。结果未知时不要重复写入。

## EDA 版本限制

当前 EDA 4.1.78 下，`schematic.modifyText`、`schematic.getPrimitivesInRegion` 和 `schematic.getPrimitiveAtPoint` 有版本保护，会拒绝执行并提示需要 EDA 4.2。`schematic.modifyText` 的宿主原生修改在 4.1.78 保存重开后会回退。不要将拒绝执行视为功能通过；EDA 4.2 的实际执行和持久化仍需核验。
