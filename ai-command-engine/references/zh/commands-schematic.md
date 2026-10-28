# 原理图操作流程

写入前先读[原理图操作要求](原理图操作要求.md)，按其中要求规划器件布局、短桩间距和标签方向。

先按[连接与环境](setup.md)核对窗口、工程和活动图页。命令选择见[高频](commands-schematic-high.md)与[低频](commands-schematic-low.md)。参数、返回字段和示例从已核对所选窗口版本的 `/help?cmd=<命令名>` 读取；`/help` 不按写入请求的 `instanceId` 路由。

## 查看和放置

1. 用 `schematic.getPageInfo`、`schematic.listComponents` 和 `schematic.listPins` 确定图页、器件和实际引脚。
2. 单件用 `schematic.placeDevice`；完整功能区才考虑 `schematic.buildBlock`。放置后核对实例身份、封装资源、引脚与焊盘编号，再继续接线。
3. `placeDevice` 的即时读回不证明已保存。无封装关联或无电气映射时，不把放置成功当作 PCB 可用。创建后核验失败可能已经留下器件；先查现场，不重放。

`placeDevice` 可同时传 `lcscId` 和 `libraryUuid` 限定查询库，省略库时保留SDK默认查询。回包的 `device` 明确实际选中的器件和库；`placementVerified` 仅说明实例放置读回，`footprintVerified`、`footprintStatus` 和 `pcbReady` 分别说明封装与实例引脚/焊盘映射的核对结果。`pcbReadyScope` 限定该结论，不代替PCB导入、保存重开或DRC。无封装符号仍可放置，会返回警告，不自动换器件。
4. 资源异常时用 `schematic.getPlacementResourcesDiagnostic` 检查现有实例。只读诊断不证明放置成功，也不授权重新创建。

## 连线和标签

| 目标 | 入口 | 关键限制 |
| --- | --- | --- |
| 一个引脚接命名网络 | `schematic.labelWire` | 引脚引用取实际位号和引脚号；已被异名网络占用时停止。 |
| 两个引脚直接连通 | `schematic.linkWire` | 正好两个引脚，不同时指定网络名。 |
| 一批已确定连接 | `schematic.batchWire` | 检查逐项结果和末次网表；失败项不会自动修复。 |
| 指定路径或标签位置 | `schematic.drawWire`、`schematic.placeNetLabel` | `drawWire` 已给导线命名时，不再叠加同名标签。 |

v0.20.53中，`schematic.batchWire` 的 `label` 项透传 `stubLen`，默认60，最小20，单位为原理图坐标。无效长度在本批写入前拒绝。每个新短桩的完整源码LINE和SDK目标网络读回确认后才开始下一项；一直无法确认时返回不可重试partial并停止整批，continueOnError也不会越过未知写入。防撞可能调整短桩方向；异网导线的交叉、重叠或端点相接不能作为安全候选。较旧版本会忽略单项`stubLen`，应以目标窗口help为准。

`schematic.linkWire` 在同向朝上或水平方向的引脚场景中，省略 `jogDir` 时默认让 U 形路径向外绕行；显式 `jogDir` 仍按请求处理。该窄规则不检查任意符号本体碰撞。检查返回的 `route` 和图面；需要明确的完整路径时，用 `schematic.drawWire` 并核对网表和DRC。连通审计通过不能证明图面无遮挡。

网络标签的`rotation`是文字旋转角，不是水平对齐方式。正常标签默认0；不要为了左向短桩把文字旋转180度。通过短桩长度、标签锚点和间距保持可读性。

`listWires.line`保留宿主原始扁平编码。实机多段WIRE中每4个数可代表一条独立线段，方向和段间顺序不固定；不要直接当作连续折线顶点。需要精确几何时结合有效原生LINE记录核对。

旋转或镜像器件后，重新调用 `schematic.listPins` 读取实际引脚端点，再确定接线路径。当前没有可用指令可靠读取图页网格时，按[原理图操作要求](原理图操作要求.md)记录网格未知，并以实际读回和界面吸附核对。

v0.20.60 两个独立 T 接样例未能证明具名多段 T 接通过。在已保存工程 `907894...` 中，4 ms 后创建失败，诊断未进入后验阶段，前后有效记录一致；在未保存新页 `dba2...` 中，15.353 s 后报 `heartbeat-fuse`，但 T 接几何已出现，创建是否返回及后验是否运行均未知，不能据此认定 `zIndex` 为根因。两个页面及当前窗口均停止后续写入，不升级或关闭。

v0.20.61 独立安装样例中，具名 T 接 `create` 约 18 ms 正常返回，同一 WIRE 的完整源码与 getter 一致；首次校验明确拒绝 ATTR `zIndex` 变化与简单新增 LINE 不对应。外层约 15722 ms 后返回 `heartbeat-fuse`，携带的阶段诊断快照已完整写入 lane log；该值只是最后上报快照，可能不代表当前状态。这证明诊断捕获到首次校验失败，不代表 T 接写入通过。40 ms 重采样 pause 未使用绝对 deadline，日志停在首次校验；不能据此认定 SDK timer 或 native resolver 是根因。

该独立测试窗口已归档。其场景经只读复核后保存、关闭、重开：目标 WIRE、四条 LINE、NET、Relevance 与 getter 保持，无图元增删；32 条图框 ATTR 仅新增 `strikeout:false`，其余字段和 header 未变。专家确认这不阻断在同窗升级 .62 候选；后续安装验收使用新页。该差异不扩大为普遍忽略字段，也不表示旧 Promise 已取消；不要据此解除其他旧窗口的写入限制。

v0.20.62 已在 EDA 4.1.78 的新页通过以下限定样例及保存关闭重开：从折线外端接入旧水平段内部，具名且带样式的旧两条 LINE 变为四条 LINE。候选要求新旧线段完整 multiset 匹配，允许旧 ID 重分配；WIRE、样式、NET 和非目标对象保持。只允许唯一 NET 的 zIndex 5→9、Relevance 4→8，并记录 `drawingOrderChanges`。反向接入、多 WIRE 合并等未验证形态不放宽，也不自动反转输入路径。

候选将 40 ms pause 改为显式箭头 callback，并共用原操作总 deadline，避免等待脱离预算；不改变超时或锁策略。第二段 LINE 模板/header 保留修改及相关回归已完成，专家复审通过；安装版具名红色 SOLID/ACE_BUS 样例正常返回成功，四段线、网络和样式保存重开保持；非目标图框的 32 条 ATTR 仅新增 strikeout:false，完整差异已保留。新页首次画线曾在 create 阶段被宿主拒绝，初始化原因未证；同页独立区域、不同网名的“先保存重开两段折线、再接 T”也返回成功，接入后再次保存重开，全部非 DOCHEAD 记录和 SDK 读回保持。此对照不能证明旧 SDK 拒绝的根因，也不能替代首次画线失败的定位。该结论不解除其他旧窗口的写入限制，也不表示旧 Promise 已取消。写入结果未知时停止依赖写入、读回现场，不盲目重试。

`setWireNet`及`repairNet`认领导线保留原颜色、线宽和线型，并核对源码中的非请求内容。`duplicateRemaining`为仍存的重复网络属性数量；改名成功不等于已清理重复标签。`dedupeWireNets`按原线一次带名重建并保留同一样式；混合样式或未支持的真实斜段会在删除前明确拒绝，不丢段后报成功。

TEXT删除使用正式`sch_PrimitiveText.delete`，并核对目标源码、模型与非目标内容。返回未知或读回不完整时停止，不自动改走整页源码写回。当前读回成功仍不等于保存重开通过。0.20.55在EDA 4.1.78的两张独立页实测：目标即时从源码和模型消失，保存重开后以原ID复活；其中一次已建立保存基线，并在删除后、保存后分别等待约5秒仍复现。持久性已知失败，不能将directDeleted当作最终删除；不重试或补偿写入，用户选择保留TEXT删除能力，help注明当前版本已知持久性失败，不禁用此路径。

`schematic.drawWire` 可能因宿主合并、属性重排或读回延迟返回 `partial`；该结果是本次写入结果不确定，不等于后续写入会持续锁定。v0.20.55 已在 EDA 4.1.78 验证默认线、共线延长及单条水平线内部垂直 T 接，并完成保存重开核对。v0.20.62 的具名红色实线两段折线 T 接，两组操作（直接接入、先保存重开折线再接入）均成功，并在 T 后保存关闭重开保持；该结论仅覆盖已列形态。多 WIRE 合并仍需单独验收。v0.20.62/.66 的新页早期首写曾在第一段 create 被宿主拒绝，尚未进入 T 校验；.66 首写前后源码仅 DOCHEAD/CANVAS，组件及导线均为空，焦点与源码 UUID 一致，延迟读回图框自行出现而导线仍为空。打开接口返回 activated 不代表该过渡状态下首次绘图已验证可用。根因未确认，不据此要求所有合法空白页必须有图框，也不重试未知写入。结果未知时先读回现场，不盲目重发。v0.20.57 及配套代理移除历史失败后的持续写锁。

NC 引脚不得接线。手工路径不要穿过第三方引脚，也不要使异名导线共线重叠；宿主可能把相接导线合并。网络标签的锚点须实际附着导线，文字看起来靠近不等于电气连接。`placeNetLabel` 返回附着未知或浮空时保留现场并停止依赖写入。源码 Y 轴与公开 API 符号相反，不能直接把源码坐标传给绘图指令。

历史记录：v0.20.53 的无名 T 接曾返回 `partial`，v0.20.55 的窄适配已通过对应实机保存重开验收。该结果不覆盖命名线、多段线或多 WIRE 合并。

v0.20.54候选针对上述默认无名水平线内部T接增加窄适配。必须同时核对原线完整拆分、请求支线、默认样式、空网络、空标签在支线中点重建、Relevance身份及已观测的顺序变化；其余有效记录保持。不会因任意zIndex变化就放行。最终只读核对不会把新建单线重复计入reused。0.20.54实机复测仍失败：适配错误要求getter线型0，而当前宿主默认值为null。

v0.20.55候选将该适配改为严格核对默认null，并保留读取成功、前后样式及源LINE全部默认字段检查。0、undefined和getter异常均不作为此形态的默认样式接受。夹具不再将listWires未返回的字段补0。EDA 4.1.78安装版已验证默认线、共线延长及单条水平线内部垂直接入成功；目标有效记录保存重开保持，第二轮全页有效记录完全一致。仅覆盖该形态，不推广命名线、多段线或多WIRE合并。

## 修改、整理和删除

- `schematic.moveComponent`、`modifyComponent`、`modifyWire`、`modifyNetLabel` 等修改以独立读回为准，不以 SDK 布尔值判断成功。`modifyWire` 先核对整批导线对象与源码，区分无属性、空值 NET、非空 NET；同一次 SDK 调用传完整颜色、线宽、线型（未请求项用核实的原值），已有空 NET 明确传 `net:''`，无属性导线不补网名。宿主 getter 将同 ID 的源码 NET 显示为 Name 时按 ID、值、父归属核对后兼容，真正 Name-only、重复或冲突属性写前拒绝。每根写后及整批末尾核对对象、源 NET 属性与 LINE ID/端点/样式，失败即停止并尝试整页恢复；恢复未确认时停止依赖该结果。0.20.18 的空 NET 单线及两条显式同名导线批量改色已在当前宿主保存重开通过；0.20.19 对主动线型仅接受写前可核对的 `0/SOLID`、`1/SHORT_DASH`、`2/DOT`，写后再核对目标编码。单根命名线实线→虚线→点线→实线已在当前 4.1.78 宿主各自保存重开通过，复杂多段线仍未验收。P4 宿主批量测试中，两条命名 A 线由 dotted 改为 dashed，仅两条 LINE 的 `strokeStyle` 改变；第三条空 NET 线及其它非目标内容保持，保存重开后有效记录相同。混合空/非空 NET 的单 net 严格 getter 筛选无法由当前接口表达，属不适用，不列为未验。`modifyComponent` 提交完整属性对象；保留现有 `otherProperty`，不要用库器件默认属性覆盖工程实例。
- `schematic.autoLayout` 仅用于整理已有功能区。先限定目标并运行 `dryRun`；真实运行前保存。移动器件后旧线不随动，`rewire` 会删除并重建相关导线。检查未重接线、跳过的复杂导线和部分移动结果；部分失败时核对 `error.cause.moved` 与现场，不假定自动回滚。
- `schematic.delete` 前核对目标 ID 和依附关系，删除后重扫。超时或读回未知时停止后续删除；`task.get` 可查询长任务，超时不代表取消。保存、关闭、重新打开后再确认删除持久。

## 检查和保存

`schematic.listComponents.allPages` 与 `schematic.structuralAudit.allPages` 须为布尔值。`schematic.structuralAudit.ncExempt` 须为字符串数组。`schematic.structuralAudit.deviceMargin` 省略时为 10 mil；传入时须为有限且不小于 0 的数字。

`schematic.exportPng` 的宽高须为 1–4096 的整数，省略时沿用指令默认值。

用 `schematic.listNets`、`listWires`、`getNetlist` 或 `exportNetlist` 比对预期引脚与网络，再运行 DRC。`structuralAudit` 用于排查图面与连接结构；图框等候选项须核实对象身份。`runDrcDetailed` 按宿主实际返回的结构标记逐条或聚合结果；EDA 4.1.78 已实测逐条明细，不能仅按版本推断。第一轮图框样例另观察到 10 个 `ATTR` 读回补出 `strikeout:false`；保留为独立观察，不据此放宽其它对象核对。`runDrc`、`runDrcDetailed` 和 `buildBlock` 的收尾审计遇到非数组或未知 DRC 结构会报“结果不可判定”；`buildBlock` 会把原因放在 `auditError` 中，此时不能视为通过。刚保存后若两次检查数量不同，应等待拓扑刷新后再查。

`schematic.exportBom(fileType=csv)` 保留宿主原始文件字节。读取返回的 `format`、`encoding`、`delimiter` 再解析；EDA 4.1.78 的 `.csv` 实为 UTF-16LE 制表符文本，不能按 UTF-8 逗号 CSV 解析。`fileName` 可传带或不带匹配后缀的名称，插件会避免重复追加后缀。`xlsx` 文件以 ZIP 文件头确认；格式无法确认时按返回的 `note` 检查原始文件。

EDA 4.1 的 `listNets` 使用 PADS 网表和命名导线回退；自动网络名可列出，但 `detail:true` 不能保证把无网络名的导线归属到对应自动网，需用 `getNetlist` 核对引脚。回退不可用会报错。点/区域图元查询需要 EDA 4.2 或更高版本。

EDA 4.1.78 的 `schematic.modifyText` 即时读回可成功，但保存重开后内容和位置会回退。本插件在 4.1.78 拒绝该指令；它需要 EDA 4.2 或更高版本，4.2 的保存持久性尚未实机验证。区域和点图元查询也需要 4.2，逐条名称见[原理图低频指令](commands-schematic-low.md#eda-版本限制)。

`getNetlist`、`exportNetlist` 可能触发宿主更新位号或 Unique ID，不能无条件当作纯只读操作。导出非空仍须解析内容。保存后用 `schematic.exportPng` 检查整页图面，并按返回文件的实际类型解码；多页导出可能是 ZIP。后台 `editor.screenshot` 可能是旧帧。需要证明持久性时，保存、关闭、重新打开，再核对身份、属性、网络及非目标内容。

## 完整器件更换

AI Command Engine 自身没有一条完成全部替换的指令。替代型号、封装和引脚映射由 AI 与人工共同确认，独立模块复用插件执行原理图与 PCB 同步替换。其 prepareReplacement、executeReplacement、getReplacementOperation 通过独立 module-reuse:rpc:v1 调用，不是 ACE HTTP 指令。带内置 Gateway 的版本由模块技能后台隐藏启动桥接，无需单独安装 Gateway 或 AI Command Engine；修正版只连接来源检查修订号匹配的桥接，调用时使用模块技能返回的地址，不回退到旧服务；覆铜、挖空、自定义开窗属于复用后的收尾修补。下面是仅使用 ACE 时的组合流程；任何一步结果未知，都先停下并只读核对。

1. 用 `project.exportFile` 保存原生 `.epro2` 备份。激活目标页，记录旧器件的 ID、位号、位置、镜像、引脚、网络及需保留的项目属性。读取源码时核对活动页 `DOCHEAD.uuid`；按首个 `||` 分开头体，以 `(type,id)` 取最高 `ticket`，空体为删除墓碑。不把旧记录当成现值，也不把源码 Y 坐标直接传给公开 API。
2. 查询新器件的 Device、Symbol、Footprint、引脚和物料信息。型号、制造商及供应商料号来自新器件，不继承旧件。
3. 在不占用旧位号和旧关联 ID 的位置放新实例。核对新资源来源、封装及逐引脚编号、绝对落点和网络映射。旧新引脚无法一一确认时不得删旧件。
4. 如需转移业务属性，以新实例完整属性为基础调用 `schematic.modifyComponent`。保留新件资源和系统属性；只叠加明确需要的项目属性。`otherProperty` 保留现有自定义键。
5. 只有新实例、连接和必要属性均确认后，才删除旧 ID，并恢复明确要求保留的位号、Unique ID、Channel ID、Group ID、Reuse Block 等项目身份。`setAttribute` 不能伪造 Device、Symbol 或 Footprint 关联。
6. 再核对原理图网表、非目标对象，保存、关闭、重开核对。PCB 更新由用户在 EDA 界面发起和确认；AI 只做前后只读检查。

## 异常修复与宏

`schematic.pruneFloatingLabels.dryRun` 和 `schematic.fixNetLabels.dryRun` 只接受布尔值；前者省略时执行清理，后者省略时只预览。

v0.20.29 候选同时严格检查 `listNets.detail`、`pruneFloatingLabels.allowSourceRewrite` 和 `repairNet.dryRun`，非布尔值在读取或写入前拒绝；各参数原有默认行为保持。新增检查尚待新版宿主验收。

标签异常先只读定位，再按问题选择 `pruneFloatingLabels`、`fixNetLabels`、`repairNet` 或 `dedupeWireNets`。支持 `dryRun` 时先预览。浮空标签、重复网名和碎网不能只凭画布判断，修复后复查网表与 DRC。源码改写兜底不是普通修复前置，只有明确需要且已备份时才考虑。

`macro` 仅用于步骤已确定且无需中途判断的组合。任一步失败或结果未知时停止依赖写入；宏返回的步骤集合键为 `steps`。需要根据读回决定下一步时分开提交。

0.20.58 安装版限定样例：两条异网短桩原本会在同一点相接，第二条自动换向，批末审计及保存关闭重开后的网表保持两网分离；两同向引脚的 U 形连接读回外侧折线路径，保存重开后连接保持。这些是几何与电气样例证据，不代表任意符号本体避让或完整图面验收。

## 当前原理图网格读取限制

EDA4.1.78／SDK0.4.26没有已核实的公开原理图网格getter。测试页在界面改为0.1inch（100mil）后，完整源码除DOCHEAD元数据外仍保持，CANVAS只有originX/Y。当前没有新增 `schematic.getGrid` 指令。

需要按网格布置或接线时，先从EDA界面确认实际网格及捕捉步长，由用户提供数值和单位；不要把原理图API坐标单位10mil当成网格步长，也不要把PCB的CANVAS字段套到原理图。没有取得当前值时明确说明未知，不默认50mil。

## 0.20.106 原理图反馈修复（部分实机通过，报告缺陷保留）

`schematic.setAttribute` 保留一次修改和原有300ms等待，改用EDA宿主计时器。诊断区分修改、等待和读回，只记录阶段与耗时，不记录属性值。参数或目标查找失败仍是写前失败；开始修改后的异常、计时器失败或读回未确认返回partial且retryable=false。先核实际属性和原调用状态，不直接重放修改。宿主计时器不保证所有SDK挂起都已修复。

`schematic.drawWire` 补充旧零长度点的精确保持；新建零长度请求仍拒绝。合法显示zIndex变化独立核对，不以新增LINE数量推断显示顺序。自动NET/Name/Relevance重建仅按本次受影响导线的几何、网络来源、归属和合法字段核对；同值重复不自动清理。跨网标签转移、冲突或未请求网络、孤儿标签、几何或样式损坏、无关内容变化仍拒绝。106实际采用逐段累计；已发现新建或消失ATTR仍可残留报告，严格初始至最终净值由107修正。既有T接窄适配及完整后验保留。合并时普通自定义属性仍须保持原ID、归属及完整内容；涉及父导线变化时保守返回partial，本版不新增普通属性迁移能力。

`schematic.exportPng` 区分宿主生成和文件编码阶段。`schematic.getNetlist` 保留原45秒等待预算，区分外层超时和原宿主调用实际结束；迟到返回不等于发起了第二次调用。日志不记录图片或网表内容。超时不表示取消，不按超时提示直接重试；确认原调用状态后再安排后续操作。网表生成可能更新位号、Unique ID或保存工程，不作为纯只读来源。

本版源码与模拟回归、打包和安装版验收分别记录。后台PNG本轮成功；JLCEDA宿主挂起已复现而根因未定，新增诊断不等于根因修复。作者旧本地包结果不代替本版安装及保存关闭重开验收。A1新页首次画线仍按用户决定等待EDA升级。

## 0.20.107 显示净变化与网表未确认结果（限定实机验收通过）

`schematic.drawWire` 的drawingOrderChanges仅比较命令首次写前快照和最终已验证快照。只报告两边均存在、ID及父WIRE相同且整数zIndex有净变化的ATTR；命令中新建、已删除、换ID重建及恢复初值的项不报告。只改回报计算，不改变几何、电气后验或SDK调用次数。

`schematic.getNetlist` 的宿主调用启动后，等待超时或宿主拒绝均返回partial=true、retryable=false，以及operation、phase和hostOperationState；既有宏入口即使stopOnError:false也停止依赖步骤。45秒等待及原调用迟到诊断保持，不重试、不加锁、不假定取消。前置焦点失败仍为零SDK调用普通错误。

0.20.106在EDA4.1.78独立副本已限定验证属性修改、两段命名线及延长；首次保存关闭重开80条有效数据保持，重连后仍保持。后台属性修改1.261秒，PNG3.618秒成功，宿主返回含两张PNG的ZIP。PNG历史挂起本轮未复现，不能称已根治。

同一副本的JLCEDA网表单次调用45.004秒超时，切前台仍未返回，45秒观测未见提示；后续SDK约300.445秒迟到拒绝，底层取消仍未证实。JLCEDA为合法枚举值；旧接口官方已弃用，新推荐文件接口仍Beta，不自动换接口掩盖失败。根因仍未定位，不称插件无法解决。未决窗口不继续写入、保存、切工程、升级或重发；新验收须隔离到独立窗口。107实际所测显示报告和保存重开81条data保持已通过，网表故障分类仅模拟验证。

## 0.20.108 JLCEDA字符串网表通道（限定实机验收通过）

`schematic.getNetlist` 的公开输入和netlistType/length/netlist返回保持。仅netlistType严格为JLCEDA时，调用开始就选择既有官方`sch_ManufactureData.getNetlistFile(undefined, 'JLCEDA')`，再读取File.text()，原样返回字符串；length仍是字符串.length，不是UTF-8字节数。未传类型默认Protel2，其他格式保持原字符串SDK路径。

该分支不先调用旧SDK，不在失败后回退，不重发文件生成。文件不存在、无可调用text方法、文本读取拒绝、非字符串或空白均不能成功。生成文件和读取文本共享原45秒总等待，阶段诊断区分生成与文本读取，不记录网表内容；迟到日志对应原完整读取Promise。调用后未确认失败仍partial/retryable=false，依赖宏停止，即使stopOnError:false。其他格式收到空白或非字符串结果时也按调用后partial处理。超时不代表底层操作取消，不增加锁或大小限制。

文件生成可能更新位号、Unique ID或保存工程，不能当纯只读。该文件接口是既有exportNetlist使用的通道；官方旧字符串接口已弃用，推荐文件接口仍Beta。本次是针对JLCEDA的预先选择，不将Beta称为全版本生产保证，不对其他格式作未验替换。[旧接口说明](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_netlist.getnetlist.html)、[文件接口说明](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_manufacturedata.getnetlistfile.html)。

107实机文件接口单次6ms返回6664字节.enet JSON，R107/R2四引脚网络正确，调用前后P2及81条data保持。108正式getNetlist(JLCEDA)已完成即时及保存关闭重开验收，耗时56/25ms；字符串与官方文件网表JSON一致，4个引脚网络正确，81条有效data保持。旧106 SDK在约300.445秒后迟到拒绝，但不能证明底层取消；后续活动文档身份已变化，未用跨文档比较判断图页数据，现场继续保留。
