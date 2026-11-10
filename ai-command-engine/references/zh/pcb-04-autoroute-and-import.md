# PCB 4 · 自动布线与SES导入

具体参数、默认值、回包和示例以目标窗口的 `__help` 为准。

## 从 AI 指令引擎菜单启动

- 点击“启动自动布线”时会检测本机 FreeRouting 服务。服务不可用时，可选择“AI 协助安装”并把请求发送给本机 AI，也可选择“手动安装”打开官方说明。配置成功后重新点击菜单。
- 启动后查询任务状态，可停止任务。任务完成后先取回 SES，核对目标 PCB，再单独确认导入。导入后检查线路和 DRC。

## 自动布线

自动布线为可选方式；布局、规则及通道检查完成且运行条件具备时，按上述提示规则提出，已明确选用后再执行。以下步骤不表示所有PCB必须自动布线。

用户发送安装请求后，先读取 `http://127.0.0.1:37864/v1/system/status`。已有健康服务就直接复用。
服务未运行时，检查本机是否已安装 FreeRouting。缺少时从 [FreeRouting 官方发布页](https://github.com/freerouting/freerouting/releases) 下载并安装对应系统的发行包。
按 [官方 API 服务说明](https://github.com/freerouting/freerouting/blob/master/docs/self-hosting.md) 后台启动。使用 `--gui.enabled=false --api_server.enabled=true --api_server.authentication.enabled=false --api_server.endpoints=http://127.0.0.1:37864`。Windows 后台启动使用隐藏窗口。
再次读取状态接口，确认返回健康状态后告知用户回到菜单。端口被其他服务使用时报告冲突并保留该服务。仅有 CLI 时可导出 DSN，外部布线后再显式导入 SES。

1. 用 `pcb.exportDsn` 读取本次输入，检查规则比较、转换和未覆盖项。保留本次 `routeBaseline`。
2. 用 `pcb.autoRouteStart` 提交任务并记录 `jobId`。按本板要求配置，具体参数查帮助。
3. 用 `pcb.autoRouteStatus` 查询。`COMPLETED` 只表示服务结束，继续检查未布通和违规报告；字段缺失不补0。
4. 用 `pcb.autoRouteGetResult` 取回原始SES。状态查询和结果取回不会自动写板。
5. 明确调用 `pcb.importAutoRouteSes`，传原始 `fileName` 和 `base64`。涉及现有ARC保护链时，再传对应 `routeBaseline`；普通无此类保护链的SES可省略。不要用事后重新导出代替原任务的来源记录。
6. 核对新增对象、已有线路保持和重复导入结果，再运行目标DRC，保存后按需关闭重开验证。

只在需要时选择分层线宽转换，并核对转换报告。规则来源未知或冲突时先核实。约束检查不完整时不能报告全部规则已处理。

线宽规则按 TRACK 字段、单位、启用铜层及源码与 SDK 的规则绑定判断，不按宿主版本白名单判断；结构未知或冲突时返回具体原因。

SES通常没有可信钻孔孔径。需要精确直接写入时，用 `viaHoleDiametersMil` 给出本次明确孔径；不能从铜外径猜孔径。`widthRuleCompliance` 分为已知违规和未知规则：违规写前拒绝，unknown不是通过。

已有ARC折线去重只在对应来源记录可确认时执行。导入不静默量化原坐标、合并短段或修改网络来通过检查；无法确认时按实际错误处理。更多结果字段见PCB专题。

已有任务仍运行或状态未知时，不重复启动。按当前帮助查询或停止任务，不猜测已取消。

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
