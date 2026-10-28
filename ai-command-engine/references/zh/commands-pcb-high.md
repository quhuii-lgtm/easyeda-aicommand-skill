# PCB 高频指令

本页是命令索引，不能代替首次写入前必读的[PCB操作要求](PCB操作要求.md)和[PCB操作流程](commands-pcb.md)。先用当前窗口的 `GET /help?cmd=<命令名>` 核对命令和参数；坐标、长度通常使用 mil，具体以帮助为准。

| 任务 | 指令 | 用途 |
| --- | --- | --- |
| 查看现状 | `pcb.listComponents`、`pcb.getComponentPads`、`pcb.listNets`、`pcb.listLayers` | 查看器件、焊盘、网络和图层。 |
| 摆放与板框 | `pcb.moveComponent`、`pcb.checkPlacement`、`pcb.drawOutline` | 移动器件、检查布局间距和建立板框。 |
| 位号与丝印 | `pcb.modifyComponentAttribute`、`pcb.checkSilkscreen` | 调整位号属性或检查丝印候选。位号修改不重新编号；丝印结果可能不完整，候选不等于已确认碰撞。 |
| 孔与焊盘 | `pcb.placeHole`、`pcb.placePad`、`pcb.placeVia` | 建立机械孔、独立表贴焊盘或过孔。孔径按设计和制造要求确定；检查帮助中的孔型、镀层及尺寸参数。 |
| 布线 | `pcb.routeTrack` | 按网络和路径布线。插件暂行规则要求每段至少 1 mil（25.4 μm），短段会在写入前拒绝；这是插件规则，不是 SDK 限制。 |
| 覆铜 | `pcb.pourCopper`、`pcb.listPours`、`pcb.rebuildPour` | 创建、查看和重建覆铜。`pourCopper` 只建立边界，需重建并读回填充结果；`no-fill` 不表示铺铜完成。 |
| 检查与保存 | `pcb.runDrc`、`pcb.runDrcDetailed`、`pcb.getNetInfo`、`pcb.save` | 运行 DRC、查询网络并保存。DRC 无错误不能单独证明可生产。 |
| 制造工艺 | `pcb.runDfm`、`pcb.runSmtDfm`、`pcb.checkSameNetPadSpacing` | 检查PCB工艺、贴装或同网焊盘间距，分别查看覆盖范围和未确认项。 |
| 生产输出 | `pcb.exportGerber`、`pcb.exportPickPlace` | 导出 Gerber 或贴片坐标。导出结果需按当前工程另行检查。 |

`pcb.connectComponentPadDirect` 为兼容保留的停用入口。当前 EDA 4.1.78 上调用会在访问工程或 SDK 前拒绝；错误标记 `disabled:true`、`retryable:false`、`writeAttempted:false`。逐焊盘只读诊断仍可用 `pcb.getComponentPads`；该诊断读到配置不代表宿主实际采用该连接规则。

官方依据：[90°圆弧等长样式](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/index.html)、[ARC接口](https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_primitivearc.create.html)、[PCB ARC格式](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/arc.md)。接口和格式声明不代替当前宿主实测。
