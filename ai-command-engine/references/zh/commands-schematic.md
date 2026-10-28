# 原理图指令

写入前先读[原理图操作要求](原理图操作要求.md)，并按[连接与环境](setup.md)确认目标窗口、工程和活动图页。指令参数和返回以该窗口 `/help?cmd=<命令名>` 为准；`/help` 不按请求中的 `instanceId` 路由。先用 `schematic.getPageInfo`、`listComponents`、`listPins` 读取图页、器件和实际引脚。

## 功能区先行

新绘功能区先调用 `schematic.placeRegion` 画框和标题，或复用 `buildBlock` 已创建的框；不要重复画框。用 `listRects` 核对框的 `span`，并核对标题和实际图像；只返回框 ID 不代表标题成功。

`placeRegion` 的 `x,y` 是框左上角及上沿，`buildBlock.region` 的 `x,y` 是左下角；两者均按 +Y 向上计算，不能照搬同一个 Y。尺寸按器件、引脚出线和文字实际占用调整。

`buildBlock` 是初放与接线宏，不保证符合布局和直连要求。默认电源网及多引脚网会逐脚放标签；显式 `style:"wire"` 也仅在实际解析为两个引脚时直连。需要区内多脚就近直连时，可用 `nets:[]` 只完成框和器件初放，读回 `refMap`、实际引脚并调整位置后，再用连接命令逐区接线。尚未接线时不能报告功能区完成。

`schematic.linkWire` 不设置网名。需明确命名的直连，按当前帮助用带网络名的 `drawWire` 或在已有导线上设置名称并读回；不能把电气已连通等同于具备预期网名。

## 放置和连接

- `schematic.placeDevice` 放置单件，必需参数及坐标以窗口帮助为准。可用 `lcscId` 与 `libraryUuid` 限定库；省略库沿用 SDK 查询范围。返回的 `device` 标识实际器件和库；`placementVerified` 只表示实例读回，`footprintVerified`、`footprintStatus`、`pcbReady` 和 `pcbReadyScope` 分别说明封装及引脚/焊盘映射核对范围。无封装符号仍可能放置并带警告。创建后核验异常时先查现场，不重放。用 `schematic.getPlacementResourcesDiagnostic` 只读检查现有实例。
- `schematic.labelWire` 将一个引脚接入命名网络：`pin` 使用实际位号和引脚号，如 `U1.7`，`net` 必填；`stubLen` 是原理图坐标长度，默认 60，最小 20；`color` 可选，`force:true` 会允许与已占用引脚合并网络。异名网络已占用时应先查现有线，不要强接。返回包含短桩、标签 ID、附着状态；`alreadyConnected:true` 表示未重复画线。标签未附着时保留现场并停止依赖后续写入。
- `schematic.linkWire` 用 `pins` 中正好两个引脚直接连接，不设置网络名。可选 `color`、`jogDir`（`down`/`up`；同向错位场景还支持 `left`/`right`）和 `force`。默认自动规划正交路径，返回 `route`、线段数和线 ID；`alreadyConnected:true` 表示两端已同网。自动路径不保证避开任意符号本体，需检查图面、网表和 DRC。
- `schematic.batchWire` 接收 `items` 数组，项类型为 `label` 或 `link`，分别使用上述参数；`continueOnError` 默认 `true`，`skipAudit` 默认 `false`。返回逐项结果、网表审计及汇总，不会自动修复失败项。未知写入会停止依赖项，即使启用继续执行也不能越过不确定结果。
- `schematic.drawWire` 用 `points` 指定路径，并可设网络名、颜色、线宽、线型和标签位置；具体字段按窗口帮助。创建后核对完整线段、网络和非目标对象。宿主合并、属性变化或读回延迟可能导致 `partial`；先读回现场，不盲目重发。异网导线交叉、重叠或端点相接不能当作安全连接。NC 引脚不得接线。源码 Y 坐标与公开 API 坐标方向相反，不能直接传入绘图指令。
- 内部 T 接只在已支持的特定线型和接入方向上有窄适配；核对原线完整拆分、请求支线、网络、样式和非目标对象。不能推广到反向接入或多条 WIRE 合并，也不能仅凭审计通过认定图面无遮挡。
- `schematic.placeNetLabel` 放置标签时锚点必须落在线上；文字靠近导线不代表连接。`rotation` 是文字旋转角，常规标签默认 0。`listWires.line` 是宿主原始扁平编码，多段线可能由每四个数描述一段，需结合有效源码 LINE 核对，不能直接当连续折线顶点。器件旋转或镜像后重新读 `listPins` 获取实际引脚端点。

## 修改和删除

- `schematic.modifyComponent` 提交完整属性对象；先读出现有工程属性并保留 `otherProperty` 自定义键，不用库器件默认值覆盖工程实例。
- `schematic.setAttribute` 按窗口帮助修改已有属性。目标或参数查找失败属于写入前拒绝；调用开始后的异常、等待或读回未确认应按 `partial:true`、`retryable:false` 处理。先查属性和原调用状态，不直接重放。
- `schematic.modifyWire` 修改时先核对目标线和源码，保留未请求变更的颜色、线宽、线型及 NET 状态。区分无 NET 属性、空 NET 和非空 NET；仅为已有空 NET 明确传 `net:''`，不为无属性导线补网名。线型值以窗口帮助和读回为准。每根线及批次结束后核对对象、NET 属性、LINE ID、端点和样式；失败或恢复结果未确认时停止依赖写入。
- `schematic.modifyNetLabel`、`setWireNet`、`repairNet`、`dedupeWireNets` 等按目标帮助使用。修改后核对标签附着、导线网络及原样式；重复属性计数不为零表示尚有重复项。`dedupeWireNets` 对不支持的几何或混合样式会拒绝，不能丢段后继续。
- `schematic.moveComponent` 不会移动旧导线。`schematic.autoLayout` 只用于整理已有功能区；先限定目标并运行 `dryRun`，真实运行前保存。`rewire` 会删除并重建相关线；检查跳过线和部分移动。失败时核对 `error.cause.moved` 与现场，不假定回滚。
- `schematic.delete` 前核对目标 ID 与依附关系，删除后重新扫描。长任务用 `task.get` 查询；超时不代表取消。任何写入结果未知时停止后续写入。确认持久性需保存、关闭、重开，再核对身份、属性、网络和非目标内容。
- 删除 TEXT 使用正式删除接口并核对源码和模型；当前已知即时删除后保存重开可能以原 ID 复活。`directDeleted` 不代表持久删除。返回未知或读回不完整时停止，不改用整页源码写回，不重试或补偿写入；help 标明持久性限制，不据此禁用全部删除路径。

## 逐区检查后再完成

按[原理图完成检查](原理图操作要求.md#原理图完成检查)执行统一验收表、保存重开范围和结果格式，不自行省略或另设一套通过标准。

每区接线后读取 `listComponents`、`listPins`、`listWires` 和 `listNetLabels` 核对本区内容；用 `exportPng` 或当前界面查看局部，整页缩略图不代替放大检查。确认分区框、标题、短连线、标签和文字避让后，再继续下一区；接口连接随相邻区完成后统一核对。

`structuralAudit` 可筛查异网桥接、框重叠、出区和碰撞候选，但不保证检测漏画的分区或全部视觉问题。零项 DRC 或审计通过不能代替逐脚网表比较和图面检查。因工具缺失而不能检查时列明未完成项，不能自行跳过后报告全部完成。

## 检查、网表和导出

- `schematic.listNets`、`listWires`、`getNetlist`、`exportNetlist` 用于核对网络和引脚；最终以网表确认预期连接并运行 DRC。`listComponents.allPages`、`structuralAudit.allPages` 为布尔值；`structuralAudit.ncExempt` 为字符串数组；`deviceMargin` 省略为 10 mil，提供时须为有限且不小于 0 的数字。`exportPng` 的宽高为 1–4096 整数，省略采用默认值。
- `schematic.runDrc`、`runDrcDetailed` 和 `buildBlock` 的收尾 DRC 结果遇非数组或未知结构时不可判定，不能视为通过。`buildBlock` 为完整功能区生成内容，不替代器件与连接逐项核对。
- EDA 4.1 的 `listNets` 可借 PADS 网表和命名导线回退列出自动网络名，但 `detail:true` 不保证将无网络名导线归属到自动网；用 `getNetlist` 检查引脚。点和区域图元查询需 EDA 4.2 或更高版本。
- `getNetlist` 默认 `netlistType` 为 `Protel2`；`JLCEDA` 使用官方文件生成通道并返回原始文本，`length` 是字符串长度而非字节数。文件生成可能更新位号、Unique ID 或保存工程，因此不是纯只读操作。JLCEDA 通道失败时不回退或重发；结果未知返回 `partial:true`、`retryable:false`，依赖宏步骤停止。超时不代表底层取消。其他类型保持 SDK 字符串通道。网表非空仍须解析核对。
- `exportNetlist` 也可能触发位号、Unique ID 或工程保存。`exportBom` 默认 `fileType=csv`，并保留宿主文件原始字节；按返回的 `format`、`encoding`、`delimiter` 解码。文件名可带或不带匹配后缀，插件避免重复后缀；`xlsx` 应按 ZIP 文件头识别。
- 保存后可用 `schematic.exportPng` 检查整页；按返回文件实际类型解码，多页结果可能为 ZIP。后台 `editor.screenshot` 可能是旧帧。若两次审计数量不一致，等拓扑刷新后重查。DRC 或结构审计结构未知时结果不可判定，不能视为通过。
- `schematic.modifyText` 在 EDA 4.1.78 被拒绝；此接口需要 EDA 4.2 或更高版本，4.2 保存持久性尚未确认。不要把即时读回当作已保存。

## 异常修复和宏

- 先只读定位标签异常，再按情况用 `pruneFloatingLabels`、`fixNetLabels`、`repairNet` 或 `dedupeWireNets`。支持 `dryRun` 时先预览；`pruneFloatingLabels.dryRun` 省略时执行清理，`fixNetLabels.dryRun` 省略时只预览。修复后核对网表和 DRC。源码改写兜底不是普通修复前置，只有明确需要且已备份时使用。
- `macro` 仅组合已确定且中途无需判断的步骤；步骤结果键为 `steps`。遇到失败或未知写入时停止依赖步骤。需要根据读回决定下一步时，分开提交。

完整器件替换不是单条 ACE 指令。替代型号、封装和引脚映射须先由 AI 与人工确认；模块复用插件的 RPC 不属于 ACE HTTP 指令。仅用 ACE 时，应先备份工程，核对新旧器件资源、逐引脚映射、网络和属性，再放置新件；全部确认后才删除旧件，并复查网表和非目标对象。PCB 更新由用户在 EDA 界面发起并确认。

官方网表接口：[旧字符串接口](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_netlist.getnetlist.html)、[文件接口](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_manufacturedata.getnetlistfile.html)。
