# 操作时必须注意的问题

本页只记录不能靠 `/help` 参数表判断的风险。常规流程见[原理图](commands-schematic.md)、[PCB](commands-pcb.md)。

## 结果与写入状态

- SDK 返回 `true`、非空 ID、单次截图或 DRC 无错误，都不能单独证明目标已完成。依据插件读回和任务所需的保存重开检查。
- 超时不代表写入已取消。结果不明时停止后续依赖写入，先用 `task.get`、当前列表或文档源码只读核对，不盲目重发。0.20.57及配套代理不再持久锁定后续独立请求，也不要求write.acknowledge。
- 删除后单对象 `get()` 可能返回缓存旧对象；用全量列表或有效源码重扫判断存在性。创建后列表也可能暂时漏项，应结合返回 ID 检查。
- 没有通用撤销 API。破坏性操作前确认备份文件实际生成；关闭页签选“不保存”不保证回滚。
- 官方无界面环境中的 `save` 返回成功不能直接证明文件已落盘；仍需区分 SDK 返回、源记录和保存重开证据。这不表示本插件支持无头运行。

## 窗口、工程和文档

- 每个 `/command` 都带当前核实的顶层 `instanceId`。`/help` 走全局所选窗口，版本不同不能照抄参数。窗口或文档切换超时后，先重读身份。
- `project.create`、`project.open` 会切换当前窗口的活动工程。切换前处理未保存修改，完成后用 `project.getInfo` 确认工程。
- `project.getDocumentSource` 可能在目标页未激活时返回当前页。先 `editor.openDocument`，再核对 `DOCHEAD.uuid`。源码坐标与公开 API 的原理图 Y 轴符号相反。
- `project.modifyTitleBlock` 只能改当前页已有字段。先看 `getPageInfo.titleBlockData`；接受提交不等于保存后已生效。纸张尺寸和符号不能靠它切换。
- 源码日志要按有效记录判断对象；旧记录和删除墓碑不能当成当前状态。

## 原理图

- `placeDevice` 使用 `deviceUuid` 时还须给 `libraryUuid`。放置即时核验不代替保存重开或网表核对。
- 修改器件保留完整现有属性和 `otherProperty`；空字符串封装、裸封装名或缺失引用可能导致网表异常。网表导出后检查是否漏器件。
- 连线不要穿过第三方引脚或让异名导线共线；宿主可能自动合并。已命名的 `drawWire` 不再叠同名标签。标签以本次 ID、父导线及属性读回确认附着，视觉靠近不够。
- `getNetlist`、`exportNetlist` 可能让宿主更新位号或 Unique ID。需要纯只读来源时先评估这个副作用。
- `dedupeWireNets` 只处理同一导线上的重复同名属性，不替异名冲突选答案。重建后图元 ID 会变化，须重新查询。
- 完整换件按[完整器件更换流程](commands-schematic.md#完整器件更换)先放新件并核对，再删旧件。PCB 更新由用户在 EDA 界面发起并确认。
- 原理图视觉核对用 `schematic.exportPng`；后台 `editor.screenshot` 可能是旧缓存帧。

## PCB和库

- PCB DRC 不查全部本体与丝印重叠。`checkPlacement` 是焊盘包围盒近似；跳过对象或 `complete:false` 不能称布局通过。
- 覆铜边框存在不代表已有实填充。`filled` 为未知时不能当作空，也不能当作完成。重铺返回成功还须核对保存态和目标区域。
- ComponentPad 的 `getConnectedPrimitives` 不返回 `Poured`，不能据此证明焊盘与实覆铜接触或不接触。
- 自动布线回灌可能清除未锁定走线；先核任务、锁定范围和回灌结果。普通 SES 导入不应套用同一清线假设。
- 库资源修改后 UUID 可能变化。官方报错也可能已有写入；先搜索并读回目标，不沿用旧 UUID 盲重试。
- 恢复工程后 UUID 可能重建。比较页、器件、网络和必要资源，不用旧 UUID 相等作为唯一条件。
- `project.importFile` 返回空值或异常时按结果未知处理，先查现场；不能凭相同名称推断已成功，也不重复导入。

## 0.20.106 原理图反馈修复（部分实机通过，报告缺陷保留）

属性已改变但回包未完成时，不直接重发。PNG或网表等待超时不表示宿主已取消。查看对应阶段、原调用和工程实际状态；网表接口可能更新位号、Unique ID并保存。当前增加诊断，不宣称所有后台挂起已解决。详见[原理图流程](commands-schematic.md)。

## 0.20.107 显示净变化与网表未确认结果（限定实机验收通过）

JLCEDA网表合法调用已在4.1.78单次超时复现，SDK约300.445秒迟到拒绝但底层效果未确认；不保存、切工程、升级或重发该现场。107仅修未确认结果partial及显示变化报告，尚未修明宿主挂起根因。详见[原理图流程](commands-schematic.md)。

## 0.20.108 JLCEDA字符串网表通道（限定实机验收通过）

JLCEDA网表用已存在的文件生成接口读取文本，保留原字符串契约。错误不改走旧接口或重复生成；文件／文本阶段未确认则partial停止依赖步骤。可能更新工程，不当纯只读。108已限定实机验收，见[原理图流程](commands-schematic.md)。

## 0.20.109 B2验收边界（限定实机验收通过）

- OVAL使用轴向标准O或任意旋转精确Oval宏的胶囊模型；零核长实际导出C，C/O/Oval表示共同判定竞争。非网格值只做精确匹配，相关参数精度未知时保留不确定，不从其他候选确认唯一关联。
- 非等径ELLIPSE保留源height，但EDA 4.1.78运行时按width成圆，不得称为真椭圆支持。
- layer12双面开窗候选只按已确认的NORMAL、扩张、默认形状及唯一外层SPECIAL覆盖规则匹配；未知或覆盖状态继续skipped。孔数据记录不代表钻孔/连通已验证，阻焊不扣孔洞。
- `geometry-correlated`不是唯一来源；`complete=false`、BOX `confirmed=false`及全板DRC/字体组合未知状态必须保留。本轮支持子集的正式指令及保存重开已通过，未覆盖配置不称通过。

详见[PCB形状与开窗专题](commands-pcb-special.md#020109-b2长圆与双面阻焊开窗限定实机验收通过)。
## 0.20.110 B2验收边界（部分实机通过）

- closed状态使用`observed-no-positive-area-opening`、`unattributed-opening-present`或`geometry-match-uncertain`；目标Gerber层不唯一或不完整时为`not-evaluated`。检查只读，不把getter读回写成写入。
- R1普通null扩张路径已在原工程实测通过；这不判断空网分支。显式源/runtime值冲突报告`overrideNeeded`。
- R2三shape唯一键路径恢复精确源值；0.1mil只适用于SDK shape getter。重复层键走同PAD网络raw接口，并强核验ID、父级、层、Pad类型和net。缺失、重复或不匹配均为未知，不猜来源优先级。
- raw `top`/`bottom`表示物理面，`inner`只用于联合bbox。`width/height×10mil`只做源几何精确比较；仅`ratio=0`且`innerpl=null`可用。标准1/12/2归一项不受raw覆盖。
- A/B两种大OVAL range设置证明inner参与bbox且外层保持default，不扩成所有range均覆盖。110仅所测路径部分实机通过；回放和自动测试不证明无网分支或完整B2。
- 实例几何与阻焊覆盖的源关联缺少原生修改样本，用户已确认本次暂保留为已知限制；制造检查继续，不称该类源关联已验收。

详见[PCB剩余功能专题](commands-pcb-special.md#020110-b2剩余功能部分实机通过)。

## 0.20.111 空网查询实机历史记录（当时未通过，已由112补齐）

- 111在rangeinner A空网查询返回空数组；当时正式检查8/20面关联。此记录只描述111历史状态。
- 0.20.112已在六工程12次正式检查中完成本轮限定验收；见[PCB专题](commands-pcb-special.md#020112-b2空网dsn适配实机验收通过)。

## 0.20.112 B2空网DSN适配（实机验收通过）

- 六工程共220个累计检查面，含保存重开重复；72个DSN派生面均关联。各次manufacturing、source、rules稳定，task0。
- DSN `outer`按同PAD身份选择。共享stack本身允许；缺失、重复、身份碰撞或精度歧义时保留unknown。Gerber只作独立核对，不用于挑选DSN候选。
- 15个精度歧义面按设计保留unknown；不当作关联缺陷。整板生产和完整源定位不在本轮结论中。

详见[PCB空网DSN专题](commands-pcb-special.md#020112-b2空网dsn适配实机验收通过)。