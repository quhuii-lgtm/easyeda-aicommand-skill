# PCB 4 · 自动布线与结果导入

具体参数、默认值、回包和示例以目标窗口的 `__help` 为准。

## 从 AI 指令引擎菜单启动

- 点击“启动自动布线”时默认选中嘉立创 EDA 原生布线，也可选择 FreeRouting 或 KiRouting。后续操作沿用该任务所选的引擎。选择 FreeRouting 后检测本机服务。服务不可用时，可选择“AI 协助安装”并把请求发送给本机 AI，也可选择“手动安装”打开官方说明。配置成功后重新点击菜单。
- 从菜单查询或停止当前任务，确认该任务已结束后再切换引擎。外部引擎完成后先取回结果，核对目标 PCB，再单独确认导入。读回线路并运行 DRC。
- 启动回包丢失时，在原 PCB 标签使用状态查询找回任务，再按需停止。菜单同时核对本次启动记录、PCB 和标签，不用旧任务替代。运行环境重启导致绑定丢失时，先核实服务任务 ID。

## 自动布线

晶振信号和局部分支不参与任何自动布线。启动前按实际晶振引脚和网络名从选网中排除。只有能保证排除时才启动。保留已验收的护地、接地孔和局部走线。导入外部结果前核对该回路，拒绝会改变它的结果。

- 原生布线优先用菜单明确勾选普通信号，或用 `pcb.nativeAutoRouteStart` 传入明确的 `RoutingNets`。保留既有线孔。使用 `pcb.nativeAutoRoute` 时同样传入明确的选网和需要忽略的网络，省略选网会扩大布线范围。
- KiRouting 启动前核对所选模式的实际目标网，包括差分对、等长组和扇出目标展开后的成员。
- FreeRouting 菜单和 `pcb.autoRouteStart` 当前没有排除网络的选项。需要排除晶振时，选用能在启动前明确排除的布线路径。

自动布线为可选方式；布局、规则及通道检查完成且运行条件具备时，按上述提示规则提出，已明确选用后再执行。以下步骤不表示所有PCB必须自动布线。

用户发送安装请求后，先读取 `http://127.0.0.1:37864/v1/system/status`。已有健康服务就直接复用。
服务未运行时，检查本机是否已安装 FreeRouting。缺少时从 [FreeRouting 官方发布页](https://github.com/freerouting/freerouting/releases) 下载并安装对应系统的发行包。
按 [官方 API 服务说明](https://github.com/freerouting/freerouting/blob/master/docs/self-hosting.md) 后台启动。使用 `--gui.enabled=false --api_server.enabled=true --api_server.authentication.enabled=false --api_server.endpoints=http://127.0.0.1:37864`。Windows 后台启动使用隐藏窗口。
再次读取状态接口，确认返回健康状态后告知用户回到菜单。端口被其他服务使用时报告冲突并保留该服务。仅有 CLI 时可导出 DSN，外部布线后再显式导入 SES。

1. 用 `pcb.exportDsn` 读取本次输入，检查规则比较、转换和未覆盖项。保留本次 `routeBaseline`。
2. 用 `pcb.autoRouteStart` 提交任务并记录 `jobId`。设置参数查当前帮助；插件按 FreeRouting 嵌套结构提交并在启动前读回有效值。`maxThreads` 控制优化阶段线程数，自动布线 pass 本身仍是单线程。检查 `routingSettings.readbackVerified`。设置未确认时使用错误信息中的 `jobId` 查询或停止任务，不要重提。设置读回通过不等于布线任务已启动。
3. 用 `pcb.autoRouteStatus` 查询。`COMPLETED` 只表示服务结束，继续检查未布通和违规报告；字段缺失不补0。
4. 用 `pcb.autoRouteGetResult` 取回原始SES。状态查询和结果取回不会自动写板。
5. 明确调用 `pcb.importAutoRouteSes`，传原始 `fileName` 和 `base64`。涉及现有ARC保护链时，再传对应 `routeBaseline`；普通无此类保护链的SES可省略。不要用事后重新导出代替原任务的来源记录。
6. 核对新增对象、已有线路保持和重复导入结果，再运行目标DRC，保存后按需关闭重开验证。

## EDA 原生自动布线

- `pcb.nativeAutoRoute` 是可选的 EDA 原生布线，用户选择后再用。
- 检查只读 `dryRun:true` 结果；网络、图层和选项查 `__help`，注意 `RoutingNets` 的 R 大写。
- `existingPrimitiveMode` 默认 `keep`；仅在明确选择时用 `remove`。
- 用 `dryRun:false` 执行；长任务用返回的 `taskId` 调用 `task.get` 查询。
- 超时或结果未知时先检查任务和 PCB，不重发，也不承诺可取消。
- 读回线路、网络和图层，再检查连通性、DRC、保存及重开持久性。
- EDA 原生、FreeRouting 和 KiRouting 流程分别处理。

### EDA 原生后台任务指令

从 PCB 工具菜单选择原生布线，再勾选要布的网络。结果由 EDA 写回当前板，可从菜单查询状态或停止任务，“取回已完成布线结果”会显示原生任务日志。通过指令操作时按下列步骤执行。

1. 启动时明确提供 `RoutingNets` 网络列表，并设 `existingPrimitiveMode: "keep"`。保留回包中的 `jobId` 和 `binding` 字段。
   插件会自动排除其余具名网络。旧版可用 `ignoreNets` 明确排除这些网络。
2. 在原 PCB 页签会话中，用回包的 `jobId`、`projectUuid` 和 `pcbUuid` 调用 `pcb.nativeAutoRouteStatus` 查询。
3. 任务完成后，用相同绑定调用 `pcb.nativeAutoRouteLog`，检查 `logs`、`result` 和 `progress` 快照；再读回新增线路及受影响的网络和图层。
4. 运行适用的 DRC，再按本次修改范围保存并检查持久性。

取消时调用 `pcb.nativeAutoRouteStop`，再查询状态，直到原生任务状态为 `canceled`。停止请求被接受不代表任务已停止。若页面刷新后状态变为 `unknown`，不要重新启动任务；检查当前 PCB 并保留未知结果。

## KiRouting 菜单流程

KiRouting 是可选外部布线工具。在 PCB 工具菜单中为新 KiRouting 任务选择 KiRouting。任务启动后，状态、停止、取回和导入操作仍绑定启动时的引擎、任务、PCB、工程和页签。

首次使用先查询 `pcb.kiRoutingInfo`。运行环境缺失时，可在菜单选择 AI 协助安装或手动配置。选择 AI 协助安装会提交已说明的本地运行环境安装；按返回的安装任务状态查询，完成后重新查询 `pcb.kiRoutingInfo`。只打开菜单或查询状态不会安装或下载。

启动前读取 `pcb.kiRoutingInfo` 返回的 `supportedModes` 和对应参数结构，再用 `__help` 核对指令参数。只选择当前运行环境明确列出的模式。调用 `pcb.kiRoutingStart` 时，明确提供 `operationId`、目标 PCB、模式参数和 `keep_input_copper:true`。启动只读取 PCB 并提交本地任务，不会将线路写入 EDA。

需要预先检查支持的输入和规则范围时，用 `pcb.exportKiRouting`。丢失任务编号时，在原 PCB、工程和页签中用 `pcb.kiRoutingList` 找回。

从菜单或 `pcb.kiRoutingStatus` 查询同一任务。若启动回包丢失，用原 `operationId` 和目标恢复查询；停止时只停止该任务。完成后用 `pcb.kiRoutingGetResult` 取回规范 KiRouting JSON，不会修改 EDA。

布线时保留已有铜皮。支持的异网实填铜皮按原图层作为障碍，并保留孔洞。若报告铜皮读取或转换不完整，先核对报告指出的对象。

检查结果和目标后，调用 `pcb.importKiRoutingResult` 做默认的只读预检。阅读预检后再明确确认 `dryRun:false` 导入。导入器会检查源码基线、输入铜保留、结果覆盖范围、目标网络、图层和已知线宽规则，然后复用现有追加导入器，不删除已有线路。导入后检查新增对象和连通性，运行 DRC，再保存重开确认持久性。

只使用当前模式返回的参数。模式出现在列表中只表示接口可用，不能证明布线满足约束；须检查生成的图形和报告。未支持的输入会明确报告，也可能导致任务在启动前拒绝；不能认为它们已参与布线。简单闭合、直线边、单环 `POLYGON` 铜焊盘会保留全局 mil 轮廓；多环、曲线或含孔的多边形焊盘尚未转换。不猜默认值、不换网络，也不降低线宽来强行布通。

- 扇出当前提供 QFN/QFP 逃逸，BGA 尚不可用。密脚扇出可能只完成部分选择；检查 `failedNets` 和 `candidateRejections` 后，再预检或导入已接受的候选。部分扇出仍需后续布线和 EDA 原生 DRC；不能接受 DRC 违规。
- 等长按测得的最终线路几何与本次明确容差判定。端点路径无法确认或已有线路存在分支时列为未验证；已布通旧线路不会自动调谐。任务完成不等于整板验收通过。
- 固定的 KiRouting 0.18 运行环境只支持通孔，不支持盲孔和埋孔。任务或导入成功不等于整板布通、规则全部符合、DRC通过或保存重开通过。
- 复杂板可能只完成部分布线。检查未完成网络，再用 EDA 原生工具或 FreeRouting 继续处理。未通过几何或规则检查的结果不会导入。
- 预检沿用 SES 每段至少 1 mil 的既有要求。更短的结果可取回，但不能原样导入；不合并或删线来绕过检查。

只在需要时选择分层线宽转换，并核对转换报告。规则来源未知或冲突时先核实。约束检查不完整时不能报告全部规则已处理。

DSN 线宽对照和转换只在当前规则快照中的 TRACK 字段、单位、启用铜层及源码/SDK 绑定均已确认时使用。`mm` 或 `mil` 等显示标签本身不能确定换算；不要只根据标签手工换算。过孔、差分规则、单层 SMT 焊盘热连接、底层阻焊/锡膏和过孔阻焊是独立检查结果，不能证明这些字段已映射进 DSN。复杂网络类或差分结构的 `globalStatus:unknown` 仍按整体拒绝处理；不以默认值替代未知项，也不部分应用默认值来凑通过。

SES通常没有可信钻孔孔径。需要精确直接写入时，用 `viaHoleDiametersMil` 给出本次明确孔径；不能从铜外径猜孔径。`widthRuleCompliance` 分为已知违规和未知规则：违规写前拒绝，unknown不是通过。

已有ARC折线去重只在对应来源记录可确认时执行。导入不静默量化原坐标、合并短段或修改网络来通过检查；无法确认时按实际错误处理。返回字段以目标窗口 `__help` 为准。

已有任务仍运行或状态未知时，不重复启动。按当前帮助查询或停止任务，不猜测已取消。

只有明确的连接检查确认启动请求尚未发出时，才可在连接恢复后正常重试。请求已提交、部分执行后超时或响应未知时，保留本次操作标记，先查询或停止；不要重复启动任务。这是处理要求，不表示已在 EDA 中复现该故障。

## DSN/SES 自动布线流程

自动布线流程分为导出 DSN、启动服务、轮询状态、取回 SES、检查导入条件、导入以及独立的 PCB 检查。每一步使用当前帮助确认参数。保留 `pcb.autoRouteStart` 返回的 `jobId`；用 `pcb.autoRouteStatus {jobId}` 查询。状态为 `COMPLETED` 后，用 `pcb.autoRouteGetResult {jobId}` 取回 `fileName` 和 `base64`。状态查询可能清除最近任务，因此取回必须明确传 `jobId`，不能依赖空参数。

取回阶段核对任务身份、文件格式、Base64、UTF-8 和当前支持的 SES 结构，不改动原始文件中的短线段、坐标、线宽或孔径。可重复只读取回。服务 `COMPLETED` 不代表已经全部布通；同时检查服务未布通和违规统计，缺失或空统计不能当作 0。取回不会导入、删除、保存或运行 DRC。服务文件名是结果文件名，不是本地路径。

确认当前 PCB、网络规则和布线输入后，才调用 `pcb.importAutoRouteSes`，传入原始文件名、Base64 及命令要求的孔径等参数。导入前检查独立执行；低于 1 mil 的线段可在取回阶段原样保留，但导入按当前输入规则拒绝，不自动合并。导入后须独立核对实际新增几何、网络、图层、规则和连接，并按任务要求保存、重开与运行 DRC。不能把服务完成、SES 结构统计或目标局部检查写成整板布通。

当 SES 可能含现有 ARC 的保护链时，须把布线前 `pcb.exportDsn` 返回对象中的 `routeBaseline` 原样保留，并与对应 DSN、job 一起使用。该记录必须对应实际提交给布线器的 DSN；事后重新导出不能证明布线期间原 ARC 未变。`routeBaseline.status` 为 `incomplete`、当前 PCB 身份不同、来源变化或保护线无法精确匹配时，不用它消解 SES 保护链。缺少 baseline 且 SES 中有可能对应当前 ARC 的保护线时，导入应在写入前拒绝；普通不含此类保护线的 SES 可按帮助执行原有路径。

ARC 保护链匹配支持范围有限，需检查当前有效 ARC 源码与实际 DSN 完整对应，并检查 SES 的线类型、网络、层、线宽和完整点列。重复或拆分检查只比较同图层、同网络的线路；跨层或异网线路仍按普通线路检查，不因坐标重合而判为 ARC 重复。切分、增加/遗漏点、重复、改线、源码变化或来源缺失不能当作既有保护链。混合多 path 且可能同时含旧保护链和新增线的 wire 会在写入前拒绝。发生拒绝时保留源文件并先查输入，不手动删改 SES 以绕过检查。导入成功只代表通过该命令支持范围内的写入和几何核对，不证明规则完整、整板电气连通或 DRC 通过。

规则符合性结果中的 `unknowns` 必须逐项阅读，含义不能按违规或通过处理。网络类继承、空选择器和未支持规则仍可能为 unknown。DSN 默认宽度与 EDA 首选规则的差异应独立查看；`routingConstraintsComplete:false` 表示约束检查不完整，不能据服务成功推断布线约束已满足。

## 命令索引

| 任务 | 命令 | 用途 |
| --- | --- | --- |
| 自动布线与导入 | `pcb.autoRouteStart`、`pcb.autoRouteStatus`、`pcb.autoRouteGetResult`、`pcb.autoRouteStop`、`pcb.exportDsn`、`pcb.importAutoRouteSes` | 启动或查看自动布线、导出 DSN、导入 SES。取回结果不会自动导入；导入前确认目标板和来源。 |
| EDA 原生自动布线 | `pcb.nativeAutoRoute`、`task.get` | 可选检查范围或执行原生布线；按任务 ID 查询长任务，并独立读回、检查 DRC 和持久性。 |
| EDA 原生后台布线 | `pcb.nativeAutoRouteStart`、`pcb.nativeAutoRouteStatus`、`pcb.nativeAutoRouteLog`、`pcb.nativeAutoRouteStop` | 明确目标网络启动，再在原 PCB 页签查询状态和日志。停止请求后须读回状态。 |
| KiRouting | `pcb.kiRoutingInfo`、`pcb.kiRoutingInstall`、`pcb.exportKiRouting`、`pcb.kiRoutingList`、`pcb.kiRoutingStart`、`pcb.kiRoutingStatus`、`pcb.kiRoutingStop`、`pcb.kiRoutingGetResult`、`pcb.importKiRoutingResult` | 检查输入范围，可选安装并运行本地引擎，找回或查看任务，再明确预检并导入结果。 |
