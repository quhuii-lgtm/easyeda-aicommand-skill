# PCB 低频指令

本页按特定任务索引，不表示命令无用或未经验证。调用前用当前窗口的 `GET /help?cmd=<命令名>` 核对命令和参数。详细限制见 [PCB 命令说明](commands-pcb.md) 与 [PCB 专题说明](commands-pcb-special.md)。

| 任务 | 指令 | 用途 |
| --- | --- | --- |
| 自动布线与导入 | `pcb.autoRouteStart`、`pcb.autoRouteStatus`、`pcb.autoRouteGetResult`、`pcb.autoRouteStop`、`pcb.exportDsn`、`pcb.importAutoRouteSes` | 启动或查看自动布线、导出 DSN、导入 SES。取回结果不会自动导入；导入前确认目标板和来源。 |
| 扇出与局部布线 | `pcb.getFanoutPlan`、`pcb.fanout`、`pcb.getPadExpansionPlan`、`pcb.expandPads`、`pcb.routePadBranches`、`pcb.routeDiffPair` | 规划或执行扇出、焊盘扩展、分支布线和差分布线。先查看计划与目标网络。 |
| 自动铜与网络丝印 | `pcb.getAutoCopperPlan`、`pcb.autoCopper`、`pcb.getPourFillReadback`、`pcb.getNetSilkscreenPlan`、`pcb.generateNetSilkscreen`、`pcb.groupBySchematicRegions`、`pcb.sourceRollback` | 规划或执行自动铜、网络丝印和区域分组；回滚前核对来源记录及目标。 |
| 文字与图元 | `pcb.listStrings`、`pcb.placeString`、`pcb.modifyString`、`pcb.listLines`、`pcb.modifyLine`、`pcb.listVias`、`pcb.modifyVia`、`pcb.modifyPour`、`pcb.delete` | 查询或修改文字、线、过孔、覆铜及删除指定图元。写入后按 ID 读回确认。 |
| 网络查询与导出 | `pcb.getNetRules`、`pcb.getNetLength`、`pcb.getNetPrimitives`、`pcb.highlightNet`、`pcb.setNetLock`、`pcb.exportNetlist` | 查询网络规则、长度和图元，锁定网络或导出网络表。规则信息不完整时保留未知状态。 |
| 网络类、差分与等长组 | `pcb.createDiffPair`、`pcb.listDiffPairs`、`pcb.deleteDiffPair`、`pcb.createNetClass`、`pcb.listNetClasses`、`pcb.addNetToClass`、`pcb.removeNetFromClass`、`pcb.deleteNetClass`、`pcb.renameNetClass`、`pcb.createEqualLengthGroup`、`pcb.listEqualLengthGroups`、`pcb.renameEqualLengthGroup`、`pcb.deleteEqualLengthGroup`、`pcb.addNetToEqualLengthGroup`、`pcb.removeNetFromEqualLengthGroup` | 管理网络分组、差分对和等长组。删除网络类不承诺恢复此前的网络颜色；修改前确认目标。 |
| 图层和层叠 | `pcb.getCurrentLayer`、`pcb.selectLayer`、`pcb.setCopperLayers`、`pcb.setLayerVisible`、`pcb.setLayerLocked`、`pcb.listStackingConfigs`、`pcb.getStackingConfig`、`pcb.applyStackingConfig`、`pcb.saveStackingConfig`、`pcb.renameStackingConfig`、`pcb.deleteStackingConfig`、`pcb.setDefaultStackingConfig`、`pcb.addCustomLayer`、`pcb.removeCustomLayer`、`pcb.modifyLayer`、`pcb.setPcbType` | 查询或设置当前层、铜层数、图层和层叠。EDA 4.1.78 已确认 `pcb.getCurrentLayer`、全部层叠配置命令及实时 DRC 命令会拒绝执行，提示需要 EDA 4.2；不要将拒绝视为功能通过。 |
| 选择与定位 | `pcb.getSelection`、`pcb.select`、`pcb.clearSelection`、`pcb.crossProbe`、`pcb.getPrimitivesInRegion`、`pcb.getPrimitiveAtPoint` | 查询选择、交叉定位或按区域和坐标查找图元。 |
| 同步、制造与检查 | `pcb.importChanges`、`pcb.checkManufacturingProfile`、`pcb.runDrcDetailed` | 原理图更新到PCB由用户在EDA界面发起并确认，AI不调用importChanges；另两项用于检查制造配置或读取详细DRC。 |
| 特殊检查与调谐 | `pcb.tuneLength`、`pcb.inspectCurveReadback` | 查询或执行曲线/长度调谐相关操作；先用当前帮助确认可用参数及宿主支持。 |

## EDA 版本限制

EDA 4.1.78 对以下入口有明确的版本保护：`pcb.getCurrentLayer`、`pcb.listStackingConfigs`、`pcb.getStackingConfig`、`pcb.applyStackingConfig`、`pcb.saveStackingConfig`、`pcb.renameStackingConfig`、`pcb.deleteStackingConfig`、`pcb.setDefaultStackingConfig`、`pcb.startRealTimeDrc`、`pcb.stopRealTimeDrc`、`pcb.getRealTimeDrcStatus`。当前宿主会报告需要 EDA 4.2；实际执行、保存和读回仍需在支持版本核验。
