# 原理图高频指令

这里的“高频”是按常见绘图流程推荐，并非调用次数统计。先按[连接与环境](setup.md)核对目标窗口。`GET /help?cmd=<命令名>` 使用代理当前选中的窗口；确认它与目标版本一致后再用返回的参数。完整限制见[原理图详细说明](commands-schematic.md)。特殊操作查[原理图低频指令](commands-schematic-low.md)。

| 阶段 | 推荐指令 | 作用 |
| --- | --- | --- |
| 看现状 | `schematic.getPageInfo`、`schematic.listComponents`、`schematic.listPins` | 确认图页、器件与引脚。 |
| 放器件 | `schematic.placeDevice` | 先按[原理图操作要求](原理图操作要求.md)规划布局，再放置并核对资源。 |
| 接线 | `schematic.labelWire`、`schematic.linkWire`、`schematic.batchWire` | 分别处理单脚接网、两脚相连和批量接线；短桩间距和标签方向按[原理图操作要求](原理图操作要求.md)规划。 |
| 精确绘制 | `schematic.drawWire`、`schematic.placeNetLabel` | 需要指定导线几何或标签位置时使用。 |
| 修改 | `schematic.moveComponent`、`schematic.modifyComponent`、`schematic.setAttribute` | 改位置、器件或属性。 |
| 检查 | `schematic.listNets`、`schematic.listWires`、`schematic.runDrc`、`schematic.getNetlist` | 核对网络、导线、规则与连通性。 |
| 保存和视觉核对 | `schematic.save`、`schematic.exportPng` | 保存并检查实际图面。 |

v0.20.53候选中，`batchWire`的label项透传`stubLen`；正常标签旋转为0，不用180度代替左对齐。放置器件后分别看`placementVerified`与封装/映射状态，不能只凭放置成功认定可转PCB。具体行为仍以目标窗口help为准。

本页共 18 条。`drawWire` 给导线命名后，不要再对同一段线使用 `placeNetLabel` 补同名标签。批量写入后核对返回结果与实际网表。DRC 无错误不能单独证明连接正确。

`drawWire` 相接时宿主可能合并旧导线；返回的 `primitiveIds` 为最终存活 ID，新增数看 `created`。0.20.21 起写前以关联 LINE 的原生 Y 轴转换后与 SDK 导线双向核对；核对失败即停在写前。部分写入或读回不明时停止后续画线并核对原图页，勿按原请求自动重试。


## 0.20.106 原理图反馈修复（部分实机通过，报告缺陷保留）

属性修改开始后的失败按partial处理，先核实际值和原调用；画线区分合法宿主显示／标签重建和真实电气、几何变化。PNG／网表挂起不自动重试，见[原理图流程](commands-schematic.md)。106所测属性、画线及保存重开已限定通过，显示报告缺陷后续见107。

## 0.20.107 显示净变化与网表未确认结果（限定实机验收通过）

显示变化只报首次写前与最终均存在的同ID同父导线ATTR净值。网表调用后失败按partial停止依赖宏；挂起不重发。107所测显示报告和保存重开已通过，故障分类仅模拟验证，见[原理图流程](commands-schematic.md)。

## 0.20.108 JLCEDA字符串网表通道（限定实机验收通过）

getNetlist(JLCEDA)开始就选择官方文件生成通道并读取字符串，其他格式仍原SDK。只调用一次，共享45秒总等待；失败不回退、不重试。108已完成JLCEDA字符串调用及保存重开限定验收，见[原理图流程](commands-schematic.md)。
