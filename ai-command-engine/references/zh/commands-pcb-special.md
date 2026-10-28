# PCB 专题命令

本文集中说明需要多步判读的 PCB 几何、制造参数、差分布线、丝印检查、自动布线导入和生产导出命令。发送命令时按当前连接协议使用 `/command`，请求外层带 `cmd`、顶层 `instanceId` 和 `params`。实例必须对应目标 PCB；参数和返回字段以该实例当前 `/help?cmd=<命令名>` 为准。宏中的每条命令也须使用正确的实例。

## 计划后执行的几何操作

密脚扇出、局部铜皮、焊盘外扩和网络文字丝印采用“只读计划→按原计划执行→读回”的流程。先从当前 PCB 读取对象真实 ID；位号、焊盘号或网络名不能代替图元 ID。读取对应计划命令后，检查 `executable`、目标、网络、图层、几何、`coverage` 和 `warnings`。计划不可执行时不写入；覆盖不完整时先判断缺项是否影响本次目标。

把计划命令返回的完整 `data` 原样放入执行命令的 `params.plan`。不要删改或重新拼装计划字段。执行后按结果核对新增对象及其网络、图层和几何。部分失败时保留已写对象并检查当前图纸，不要重放旧计划；命令不会自动完成整板 DRC、保存或制造验收。需要持久性确认时，按任务要求保存并关闭重开读回。

铜区操作受共享 SDK 调用时限约束。超时不表示宿主操作已取消；结果不明时停止依赖该写入，不启动相关写入或重复执行。

| 操作 | 计划命令 → 执行命令 | 判读要点 |
| --- | --- | --- |
| 密脚焊盘扇出 | `pcb.getFanoutPlan` → `pcb.fanout` | 只把目标焊盘引到出口通孔，不完成整条网络布线。 |
| 局部铜皮 | `pcb.getAutoCopperPlan` → `pcb.autoCopper` | `pour` 是边框覆铜，受规则裁剪；`fill` 是固定导电形状，两者不可互换。 |
| 焊盘外扩 | `pcb.getPadExpansionPlan` → `pcb.expandPads` | 创建禁铺铜、禁固定填充或阻焊区域，不改变焊盘铜尺寸。 |
| 网络文字丝印 | `pcb.getNetSilkscreenPlan` → `pcb.generateNetSilkscreen` | 生成可编辑文字，不产生电气连接；检查可读性和与焊盘、板框、其他文字的距离。 |

### 扇出

目标可按器件、焊盘或网络选择，但 ID 必须来自当前 PCB。线宽、过孔铜外径、钻孔、引出长度和间距按设计要求明确给定，单位为 mil；钻孔须小于过孔铜外径。多层或通孔焊盘须明确选择从顶层或底层引出。当前扇出创建通孔，不能称为盲孔或埋孔。

板框、障碍、焊盘形状或规则无法安全解析时，计划应为不可执行。成功扇出只说明完成了计划覆盖的焊盘引出，不证明全网连通、DRC 或可制造性。

### 局部铜皮

计划按网络和铜层分组，不会把不同网络合并为同一铜片。当前板框解析只接受已核实的单一闭环；曲线、多环或障碍信息不完整时，不把部分计划当成安全几何。

`pour` 可能被覆铜规则裁剪成边框或零填充。新建或重建后可用 `pcb.getPourFillReadback` 核对填充对象、父边框、网络和图层。读回路径非空不代表几何正确或达到制造要求。执行回执或填充读回未知时停止依赖结果；保留已创建边框并先检查图纸，不自动重建或删除。`executable:true` 仅代表计划检查允许执行，不保证宿主实际生成填充。

新建覆铜可指定网络；现有覆铜改网或改名的自动化路径尚不支持。若在 EDA 中手动处理，操作后须核对覆铜顺序、重建结果和实际填充。不要把自动删除再创建覆铜描述为无损改网方案。

### 焊盘外扩和网络丝印

焊盘外扩只支持计划明确覆盖的焊盘形状。曲线轮廓可能是近似值；须保留计划的完整轮廓和分片，不能删减。阻焊外扩最终仍要核对生产输出。

网络丝印只是文字对象。核对目标焊盘网络、文字层、旋转和底层镜像，并在执行后检查与焊盘、板框和其他文字的视觉间距。

## 下单工艺检查与制造参数

### 嘉立创下单检查

`pcb.runDfm` 检查 PCB 工艺，`pcb.runSmtDfm` 检查 SMT 贴装，`pcb.checkSameNetPadSpacing` 单独检查同网焊盘间距。PCB 菜单“嘉立创下单检查”与命令共用检查处理和结果汇总。检查不会自动修图、保存、上传或下单。

参数按当前帮助确认：

| 参数 | 要求 |
| --- | --- |
| `material` | `FR4`、`HDI板`、`高频板`、`铝基板`或`铜基板`；支持值以当前命令帮助为准。 |
| `thickness` | PCB 厚度，单位 mm，有限正数。 |
| `outerCopperOz` | 外层铜重，当前支持数字 `1` 或 `2`。 |
| `innerCopperOz` | 内层铜重，当前支持数字 `1`。 |
| `standard` | `economy` 或 `standard`。 |
| `minSpacingMm` | 同网焊盘间距下限，单位 mm，有限正数。 |

请求铜重由用户按本次下单要求明确提供，不从图纸读数或默认值代填。铜厚参数只适用于 PCB DFM，不适用于 SMT DFM 或同网间距命令。调用前须确认安装版帮助包含所需字段；不能仅凭发送额外参数推定旧版已按该铜厚检查。

PCB DFM 覆盖 18 项，SMT DFM 覆盖 7 项，同网间距命令覆盖 1 项。回包的 `data` 包含 `results`、`expectedCount`、`issues`、`coverage`、`documentUuid`、`checkType`、`inputs`、`timestamp`、`upstream` 及汇总状态。只有 `complete:true` 且 `passed:true` 才能报告该命令覆盖范围内通过。`ok:true` 只表示处理器返回成功；`upstreamPassed` 是兼容字段，不代表嘉立创在线服务已通过。

输入不全、读取失败或必要数据使用回退/推断值时，检查必须是不完整。应同时检查 `coverage`、`issues` 和 `upstream`，不能只看 `passed` 或问题数量。源铜厚报告与 DFM 判定分开；图纸铜厚不一致、物理层记录缺失或无法解析，不自动构成 DFM 失败，也不能据此判断铜重命中。

这些命令复用本地工艺参数表与几何算法，不是嘉立创网站实时同步的全量检查，也不是生产放行。现有几何近似包括：线间距只计算 `Line` 正间隙，不覆盖接触、重叠、`Arc` 或 `Polyline`；长圆及不等边焊环按最大轴近似；同网焊盘间距按胶囊体和内接圆近似。有效铜层数量使用铜图元启发式，器件类别可能按名称识别，定位 ID 可能由列表索引辅助匹配。报告中的位置仅用于辅助查看，命令不自动修复图纸。

菜单可显示逐项结果和问题位置，并由用户选择导出 TXT 或 JSON。AI 命令不弹保存窗口，也不清日志或自动写报告。定位前确认当前 PCB 与报告目标一致；不能把另一块板的坐标用于定位。

### 制造参数、订单和规则核对

`pcb.checkManufacturingProfile` 只读比较调用方提供的 JSON `profile` 与当前 PCB 可读规则，不保存参数、不改板、不下单。用文件内容传入 `profile`；不要把它写进工程描述，也不要声称扩展配置随工程保存。

主要字段如下：

| 字段 | 内容与约束 |
| --- | --- |
| `schemaVersion`, `profileId`, `revision` | 版本为 `1`，并提供参数文件标识和修订标识。 |
| `manufacturer`, `productType`, `stackupId` | 明确板厂、产品类型和具体叠层。 |
| `source` | `{url,observedAt}`，记录实际来源和查询时间。 |
| `selection` | `{copperLayers,nominalThicknessMm,outerCopperOz,innerCopperOz}`，记录板层数、名义板厚和内外层铜重。 |
| `officialStackup` | 与 `stackupId` 对应的 `orderedLayers:[{name,kind,thicknessMm,material?,dk?}]`；`kind` 为 `copper`、`prepreg` 或 `core`，未知数值写字符串 `unknown`。 |
| 成品厚度字段 | 可选 `finishedThicknessMm` 和 `finishedTolerancePercent`，仅在叠层明确列出时填写。 |
| `calculations` | 可选的阻抗计算记录数组。 |
| `orderConfirmation` | 真实订单确认记录，必须含 `schemaVersion:1`、`confirmed:true`、来源、板厂、产品、叠层及已确认的 `selection`。 |
| `impedanceService` | 省略表示未知，`null` 表示明确未开通；开通时提供来源和计算记录。 |

铜层数大于 2 时，`selection.innerCopperOz` 须为正有限值；一层或两层板省略内层铜重。订单选择也遵守此条件。没有真实订单确认时，不能用计划值代替，也不能因内铜不适用而掩盖缺失订单。

每条计算记录包含 `id`、`stackupId`、`source`、`evidenceStatus`、`model`、`targetOhm`、`signalLayer`、参考层、线宽、适用的线距或铜边距、补偿开关和 `bindings`。`evidenceStatus` 为 `verified` 或 `unverified`；前者仅表示调用方提供了可见计算证据，不是插件认证。叠层顺序从顶到底，层名须唯一；信号层和参考层须引用该叠层中的铜层。明确没有某侧参考层填 `null`，尚未确认则省略，不能用 `null` 表示未知。

模型值为 `single-ended-non-coplanar`、`single-ended-coplanar`、`differential-non-coplanar` 或 `differential-coplanar`。仅差分模型填写 `spacingMil`，仅共面模型填写 `copperGapMil`；不适用的参数省略，不用 0 代替。`widthSpacingComplement` 记录计算器实际补偿开关，不代表阻抗容差。

`bindings:[{net,edaLayerId,layerMappingSource}]` 明确网络、EDA 层 ID 和映射来源。制造层名不能直接当作 EDA 层 ID。同一制造信号层与 EDA 层须一对一；没有映射时不猜网络，也不拿默认规则冒充网络已知规则。订单及阻抗服务记录均来自调用方，不是插件从下单网站独立读取。

`physicalLayerEvidence` 会保留原始物理层记录及 `thicknessRaw`。仅在 EDA 4.1.78 且 `thicknessUnitStatus` 为 `observed-mil-eda-4.1.78` 时，有限非负值按 0.0254 换算为 mm；其他版本或无效值不生成换算值。物理层记录身份有效且 `zIndex` 唯一时，可按来源顺序返回 source 层序；重复 `zIndex` 或顺序冲突仍为 unknown。该来源级换算与排序不证明实际制造叠层、板厂层映射、名义或成品板厚、阻抗或订单匹配。结果 `items` 按项返回 `matched`、`mismatch`、`unknown` 或 `not-applicable`，并说明双方值、单位、来源和原因。`overall` 可能为 `mismatch`、`incomplete` 或 `matched-within-scope`。只有证据覆盖范围内匹配才可报告 `matched-within-scope`；这不等于制造保证。真实计算或订单证据缺失时，保留 unknown/incomplete。名义板厚与叠层的成品厚度是不同定义，逐层厚度和铜重也分开核对。不要从通用 FR4 值补叠层介电常数，也不要把近似计算写成生产保证。

官方资料：[嘉立创阻抗与叠层说明](https://jlcpcb.com/impedance)、[嘉立创阻抗计算器](https://jlcpcb.com/pcb-impedance-calculator)。配置选择器格式参考[官方规则选择器说明](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/rule_selector.md)。资料定义本身不证明当前宿主采用方式或生产合格。

## 网络规则、差分走线与补长

### 网络类与网络规则

| 命令 | 用途 |
| --- | --- |
| `pcb.createNetClass`、`pcb.renameNetClass`、`pcb.deleteNetClass` | 建立、改名或删除网络类。 |
| `pcb.listNetClasses` | 查看网络类。 |
| `pcb.addNetToClass` | 将网络加入网络类；删除成员按当前帮助确认对应命令。 |
| `pcb.createDiffPair`、`pcb.listDiffPairs` | 建立或查看差分对；删除命令按当前帮助确认。 |
| `pcb.getNetRules` | 只读查看网络规则，例如线宽和间距；当前不提供规则写入。 |
| `pcb.getNetLength`、`pcb.getNetInfo`、`pcb.getNetPrimitives` | 查看网络长度、详情和网络图元。 |
| `pcb.highlightNet` | 高亮或取消高亮网络，辅助定位。 |

网络类增删、改名和差分对配置均为写入。写入结果不明时停止后续相关写入，并先读回当前状态。规则读取可能保留 unknown；不能自行推断空选择器的继承关系。明确的网络自身规则只有在来源、SDK 所属类和规则值一致且结构属于已支持范围时才可确认。已读取规则只说明配置值，不证明宿主 DRC 实际判定或制造合格。

### 指定路径差分走线

`pcb.routeDiffPair` 按中心路径生成正、负两条耦合折线。调用前查当前帮助。参数 `pair:{positiveNet,negativeNet}` 指定两个已存在且不同的网络；`path` 为中心线路径点列，`width` 和 `gap` 单位为 mil，`layer` 指定已启用的 SIGNAL 层。`gap` 是铜边间距，中心线间距为 `width+gap`。

`dryRun:true` 只读预览；省略或为 `false` 时执行写入。方向偏移依据坐标路径方向，反转路径会交换线条在空间中的一侧，但不交换输入网络名。命令只移除几何等价的连续重复点和同向共线中间点，不吸附或拉长输入。遇到反转、自接触、正负段间距不足或数值不可靠时会在写入前拒绝整对。

执行后逐段读回并核对源码覆盖、非 LINE 记录和规则保持。中途失败返回 `partial` 及已完成侧和失败候选信息，应停止后续写入；不自动重试、删除或回滚。`plannedLengths` 只表示本次路径计划长度，不是整网长度。转角可能造成两侧长度不同。命令不自动避障、蛇形调长、并联重复焊盘或建立差分规则，也不自动保存。创建成功不证明实际连通、全板 DRC、参考面、等长或阻抗合格。

### 蛇形补长

`pcb.tuneLength` 在指定区域为开放走线链补长。`net`、`targetLength` 和 `region:{xMin,yMin,xMax,yMax}` 使用当前 PCB 坐标，长度和坐标单位为 mil。`targetLength` 是所选链的中心线总长，不是网络所有支线长度之和。

用 `primitiveIds` 明确选择同网、同层、同宽且未锁定的开放单链。省略时，`net` 与 `region` 必须完整包含唯一候选直线。可用 `tunePrimitiveId` 指定调节段；命令只替换该段，其余选中段保持。`region` 限制新增铜轮廓，调节段两端须完全位于区域内。

先用 `dryRun:true` 预览；省略或为 `false` 时执行。`side` 为 `auto`、`left` 或 `right`，相对按端点排序后的路径，正法向为 `[-dy,dx]`。`auto` 尝试两侧和可用调节段。找不到当前支持的蛇形路径时返回原因，不等于所有形状都无解。

圆弧样式须明确提供 `bendRadius`，表示圆弧中心线半径。当前 SDK 未提供可靠的局部蛇形半径、容差和自间距映射，因此调用方也须明确给出 `lengthTolerance` 和 `minSelfGap`；单位为 mil。`lengthTolerance` 是累计总长误差，`minSelfGap` 是新增蛇形非相邻段的铜边间距。不能用差分间距或其他网络的容差代替。响应中的 `parameterSources` 说明参数来自调用方还是当前不可确认的规则映射。

目标已在容差内时返回 `changed:false`，不写入；目标短于当前长度且超出容差时报错。命令按 1 mil 最短非零线段要求检查。原线中途有支线、焊盘或过孔时，必须确认替换后连接保留；不能确认就不写。成功后按返回的计划长度与源码读回长度检查本次所选链。失败可能返回 `partial`、新线 ID、删除尝试和旧线状态；此时停止依赖结果，不自动重试、回滚或保存。几何成功不代表全板间距、连接、阻抗或制造通过。

### 重复焊盘分支

`pcb.routePadBranches` 用于两条不同网络的重复焊盘分支，不是差分布线。参数包含 `pair:{positiveNet,negativeNet}`、`layer`、`width` 和 `clearanceMil`；每侧提供 `{joinPoint:[x,y],branches:[{padId,waypoints?}],trunk?:{primitiveId,endpoint:"start"|"end"}}`。单位为 mil。`clearanceMil` 是异网铜边间距下限，不是恒定差分间隙；即使为零也不允许异网接触。1 mil 最短值仅针对非零线段，不是线宽下限。

起点按真实 PAD ID 解析。省略 `waypoints` 时直连汇合点；提供时只列中间点。支持可靠解释的圆形、旋转矩形、圆孔镀通孔，以及普通无孔外层 OVAL 胶囊形焊盘；OVAL 支持横向、纵向和旋转，等宽时按圆形处理，不按椭圆计算。OVAL 尺寸优先采用有效源码；SDK getter 仅接受精确匹配或已确认的最近 0.1 mil 投影，并在结果中报告投影差值。偏心或带孔 OVAL、特殊层和无法解释的复杂形状不支持。通孔可从孔内开始，但连续路径前缀随后须接触焊环。器件 PAD 的锚点和几何结论限于 SDK 模型，不能据此推断嵌入封装源码精度。

同侧支路可在汇合点相接，或合流后共享连续后缀。擦碰后分离再合流、离开焊盘后绕回等形态会写前拒绝。提供 `trunk` 时可指向实际 LINE 端点，或指向已确认的 ARC 实际端点。插件会核对网络、图层和端点；ARC 还须同 ID 的有效源码与新鲜 SDK 读回一致，才确认接触。ARC 来源缺失、读回失败或不一致时保留 unknown，并由 `arcContactResolution` 披露状态；调用方不必另行运行曲线检查来拼装证明字段。省略 `trunk` 只表示支路相接，不表示已连接既有主干。`dryRun:true` 可选预览，不需要计划令牌。命令串行写入并读回；失败保留已完成线段和失败阶段，不自动重试、回滚或保存。宿主可能合并或拆分 LINE 并改变 ID，按最终几何覆盖核对，不因旧 ID 消失而盲目补画。结果不等于整板 DRC、原生连通或阻抗验收。

## 丝印间距检查

`pcb.checkSilkscreen` 分别检查当前 PCB 中可读的丝印对象和制造输出。检查范围、参数和返回字段以当前帮助为准。SDK 来源可能包含直线、圆弧、Polyline；封装局部几何和板级对象的来源身份应区分，不要将局部图元 ID 冒充板级 SDK ID。

SDK 候选检查会把同面丝印文字、位号、线、弧、Polyline 和焊盘按可用几何进行近邻筛查。包围盒重叠只代表需要复核，不是精确字形或墨迹碰撞。来源映射不清、对象枚举不全或几何不支持时，应读 `coverage`、`unsupported` 和完整性状态；候选的 `confirmed:false` 或整体 `complete:false` 不能报告为通过。铜层和异面对象不参与同面比较。

制造通道解析已支持的 Gerber 图层并报告面、类别和几何冲突；制造输出结果与 SDK 候选分开阅读。制造输出完整只表示受支持语法解析完整，不表示所有字体、宏、圆弧、封装来源或整板制造规则均已覆盖。区域汇总数不一定等于独立碰撞数量；辅助位置框或附近来源命中只是候选，不证明唯一制造来源。制造通道和 SDK 检查均不会自动修改图纸。

## DSN/SES 自动布线流程

自动布线流程分为导出 DSN、启动服务、轮询状态、取回 SES、检查导入条件、导入以及独立的 PCB 检查。每一步使用当前帮助确认参数。保留 `pcb.autoRouteStart` 返回的 `jobId`；用 `pcb.autoRouteStatus {jobId}` 查询。状态为 `COMPLETED` 后，用 `pcb.autoRouteGetResult {jobId}` 取回 `fileName` 和 `base64`。状态查询可能清除最近任务，因此取回必须明确传 `jobId`，不能依赖空参数。

取回阶段核对任务身份、文件格式、Base64、UTF-8 和当前支持的 SES 结构，不改动原始文件中的短线段、坐标、线宽或孔径。可重复只读取回。服务 `COMPLETED` 不代表已经全部布通；同时检查服务未布通和违规统计，缺失或空统计不能当作 0。取回不会导入、删除、保存或运行 DRC。服务文件名是结果文件名，不是本地路径。

确认当前 PCB、网络规则和布线输入后，才调用 `pcb.importAutoRouteSes`，传入原始文件名、Base64 及命令要求的孔径等参数。导入前检查独立执行；低于 1 mil 的线段可在取回阶段原样保留，但导入按当前输入规则拒绝，不自动合并。导入后须独立核对实际新增几何、网络、图层、规则和连接，并按任务要求保存、重开与运行 DRC。不能把服务完成、SES 结构统计或目标局部检查写成整板布通。

当 SES 可能含现有 ARC 的保护链时，须把布线前 `pcb.exportDsn` 返回对象中的 `routeBaseline` 原样保留，并与对应 DSN、job 一起使用。该记录必须对应实际提交给布线器的 DSN；事后重新导出不能证明布线期间原 ARC 未变。`routeBaseline.status` 为 `incomplete`、当前 PCB 身份不同、来源变化或保护线无法精确匹配时，不用它消解 SES 保护链。缺少 baseline 且 SES 中有可能对应当前 ARC 的保护线时，导入应在写入前拒绝；普通不含此类保护线的 SES 可按帮助执行原有路径。

ARC 保护链匹配支持范围有限，需检查当前有效 ARC 源码与实际 DSN 完整对应，并检查 SES 的线类型、网络、层、线宽和完整点列。重复或拆分检查只比较同图层、同网络的线路；跨层或异网线路仍按普通线路检查，不因坐标重合而判为 ARC 重复。切分、增加/遗漏点、重复、改线、源码变化或来源缺失不能当作既有保护链。混合多 path 且可能同时含旧保护链和新增线的 wire 会在写入前拒绝。发生拒绝时保留源文件并先查输入，不手动删改 SES 以绕过检查。导入成功只代表通过该命令支持范围内的写入和几何核对，不证明规则完整、整板电气连通或 DRC 通过。

规则符合性结果中的 `unknowns` 必须逐项阅读，含义不能按违规或通过处理。网络类继承、空选择器和未支持规则仍可能为 unknown。DSN 默认宽度与 EDA 首选规则的差异应独立查看；`routingConstraintsComplete:false` 表示约束检查不完整，不能据服务成功推断布线约束已满足。

## 网络与生产导出

| 命令 | 输出或用途 | 判读限制 |
| --- | --- | --- |
| `pcb.exportDsn` | 导出自动布线输入 DSN；在支持的版本中也返回与 DSN 对应的 `routeBaseline`。 | 保留原返回对象和实际送交服务的 DSN；不证明规则完整。 |
| `pcb.exportNetlist` | 导出当前 PCB 网络表。 | 导出成功不等于网络连接正确；对照目标板和网络来源。 |
| `pcb.exportGerber` | 导出制造 Gerber 数据，返回内容按当前帮助处理。 | 必须核对图层、孔、板框及文件完整性；导出成功不代表生产验收。 |
| `pcb.exportPickPlace` | 导出贴片坐标数据。 | 需核对器件、单位、坐标原点和方向；导出成功不代表贴装数据已验收。 |
| `pcb.autoRouteGetResult` | 取回服务原始 SES 文件名和 Base64。 | 只读，不等于已导入或已保存。 |

生产导出由调用方按返回格式解码或保存；核实当前帮助中的编码、内容和文件字段。逐项检查导出完整性以及工程与目标制造设置是否一致。文件存在、Base64 可解码或布线服务成功都不能替代文件内容检查、PCB DRC、制造审核或实际订单确认。

## 网络查询与交叉定位

`pcb.select`、`pcb.clearSelection`、`pcb.getSelection` 用于管理当前选择；`pcb.crossProbe` 在原理图和 PCB 间定位位号、引脚或网络；`pcb.getComponentPads` 查询器件焊盘。调用前确认实例和对象 ID。交叉定位、高亮和选中只辅助查看，不表示对象连接或保存状态。网络拓扑核对可组合 `pcb.getNetInfo`、`pcb.getNetPrimitives`、`pcb.getNetLength` 和 `pcb.exportNetlist`；多个读数一致仍不能替代适用的 DRC 和实际连通检查。
