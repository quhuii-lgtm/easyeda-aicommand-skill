# 原理图高频指令

本页按常见绘图任务索引，不表示实际调用次数。先按[连接与环境](setup.md)核对目标窗口和图页，再用 `GET /help?cmd=<命令名>` 确认参数。写入前的布局和接线规划见[原理图操作要求](原理图操作要求.md)；操作细节见[原理图流程](commands-schematic.md)。

| 任务 | 指令 | 用途 |
| --- | --- | --- |
| 查看现状 | `schematic.getPageInfo`、`schematic.listComponents`、`schematic.listPins`、`schematic.listNets` | 确认目标图页、器件、引脚和网络。 |
| 功能分区 | `schematic.placeRegion`、`schematic.listRects`、`schematic.modifyRect` | 新绘功能区先画带标题的框，读回范围；按内容调整大小，不漏画或只写分区计划。 |
| 放置器件 | `schematic.placeDevice` | 放置器件后核对封装资源和引脚映射；放置成功不代表可直接转入 PCB。 |
| 接线 | `schematic.labelWire`、`schematic.linkWire`、`schematic.batchWire`、`schematic.drawWire` | 单引脚接网、两脚直连、批量接线或指定路径绘线。 `linkWire` 必须恰好提供两个引脚。 |
| 网络标签 | `schematic.placeNetLabel` | 指定网络标签位置；`drawWire` 已设置网络名时不要再在同段线上叠加同名标签。 |
| 修改 | `schematic.moveComponent`、`schematic.modifyComponent`、`schematic.setAttribute` | 移动器件、修改器件或属性。 |
| 检查与保存 | `schematic.listWires`、`schematic.runDrc`、`schematic.getNetlist`、`schematic.save`、`schematic.exportPng` | 核对导线、规则、网络表，保存并查看图面。DRC 无错误不能单独证明连接正确。 |

`batchWire` 的 `label` 项可用 `stubLen` 指定短桩长度，省略时默认 60，最小按 20 处理；旧版本可能忽略该参数，先查当前窗口帮助。`batchWire` 会逐项返回结果并汇总网表审计，不自动修复失败项。写入或读回结果不明时，停止后续依赖该结果的操作，先核对当前图页和实际网表，不要按原请求自动重试。
