# PCB操作流程

绘制或修改前按[PCB操作要求](PCB操作要求.md)规划布局、走线、换层和制造条件。使用本页选择执行顺序；命令名查高低频索引，参数查目标插件版本的帮助。

## 接收设计与读取现状

原理图更新到PCB由用户在EDA界面发起并确认。AI不调用 `pcb.importChanges` 或官方导入接口。更新前后读取器件、封装关联、焊盘网络及非目标对象，避免把同步请求当成已经完成。

用 `pcb.listComponents`、`pcb.getComponentPads`、`pcb.listNets`、`pcb.listLayers` 读取现状。对象ID来自当前PCB，不从旧截图或其他工程套用。焊盘数组从1开始的索引与运行时ID分别核对。

## 板框、图层和布局

- `pcb.drawOutline` 使用左下角坐标和mil尺寸。重复建立板框前，先核对已有图元类型与ID。
- `pcb.setCopperLayers` 设置铜层数，不代表物理层叠已配置；层叠应用后重新读取。默认层叠不等于当前PCB已应用。
- 图层名称与层号以当前命令帮助为准。未知名称不猜测，内层先确认当前板中可用。
- `pcb.moveComponent` 后核对位置、角度、面和锁定状态。`pcb.checkPlacement` 基于可读取的焊盘边界，跳过或不支持的对象不能当成布局通过。
- `pcb.groupBySchematicRegions` 仅用于明确要求按功能区整理的任务。先看 `dryRun`、板框容纳情况和尺寸来源，再执行。

## 走线与过孔

`pcb.routeTrack` 按 `points:[[x,y],...]` 依次创建线段。网络必须已存在；`width` 与 `currentA` 按帮助选择。坐标和线宽使用mil，每个相邻段至少1mil，这是插件当前输入政策，不是SDK通用限制。

目标层使用 `top`、`bottom` 或实际层号。支持相应名称映射的版本也可用 `inner1` 等别名；旧版本需传数字内层ID。名称解析不单独证明图层已启用、可写或电气有效。

`pcb.placeVia` 明确指定网络、坐标、铜外径和钻孔；孔径小于铜外径。过孔不代替NPTH安装孔。独立焊盘或安装孔使用 `pcb.placePad`、`pcb.placeHole`，按命令帮助明确孔型、铜和阻焊。

创建回执中的ID不单独证明成功。按读回核对网络、层、端点、线宽、孔径及原对象保留情况。`connectivityVerified:false` 表示未确认电气连通；飞线计算请求被接受也不能替代目标DRC。

走线分段失败返回 `partial` 时，先核对已写入部分，不重放整条路径。不要为消除连接报告自动删线、重建或保存重开；这些操作应有明确目的和授权。

## 扇出、差分和补长

扇出使用 `pcb.getFanoutPlan`，检查目标、尺寸、障碍和 `executable`，再将完整计划交给 `pcb.fanout`。计划过期后重新读取，不修改内部证明字段。

指定路径差分用 `pcb.routeDiffPair`；补长用 `pcb.tuneLength`；重复焊盘分支用 `pcb.routePadBranches`。它们不自动完成任意整板避障或阻抗设计。输入、支持形态和结果判读见[PCB专题](commands-pcb-special.md)。

## 自动布线

插件使用已运行的FreeRouting REST服务，不包含启动器；仅有CLI时使用“导出DSN→外部CLI→显式导入SES”。不要把进程存在当成REST服务可用。

1. 用 `pcb.exportDsn` 读取本次输入，检查规则比较、转换和未覆盖项。保留本次 `routeBaseline`。
2. 用 `pcb.autoRouteStart` 提交任务，记录 `jobId`；参数按本板给定。`maxPasses` 是正整数，`automaticNeckdown` 默认false。
3. 用 `pcb.autoRouteStatus` 查询。`COMPLETED` 只表示服务结束，继续检查未布通和违规报告；字段缺失不补0。
4. 用 `pcb.autoRouteGetResult` 取回原始SES。状态查询和结果取回不会自动写板。
5. 明确调用 `pcb.importAutoRouteSes`，传原始 `fileName` 和 `base64`。涉及现有ARC保护链时，再传对应 `routeBaseline`；普通无此类保护链的SES可省略。不要用事后重新导出代替原任务的来源记录。
6. 核对新增对象、已有线路保持和重复导入结果，再运行目标DRC，保存后按需关闭重开验证。

`applyLayerWidthRules` 默认false。显式true只转换当前能可靠确认的分层线宽，并披露变化；未知、冲突或来源变化会拒绝转换，不修改EDA规则。`routingConstraintsComplete:false` 不能当全部规则已处理。

SES通常没有可信钻孔孔径。需要精确直接写入时，用 `viaHoleDiametersMil` 给出本次明确孔径；不能从铜外径猜孔径。`widthRuleCompliance` 分为已知违规和未知规则：违规写前拒绝，unknown不是通过。

已有ARC折线去重只在对应来源记录可确认时执行。导入不静默量化原坐标、合并短段或修改网络来通过检查；无法确认时按实际错误处理。更多结果字段见PCB专题。

已有任务仍运行或状态未知时，不重复启动。按当前帮助查询或停止任务，不猜测已取消。

## 覆铜与丝印

`pcb.pourCopper` 建立覆铜边框；用 `pcb.rebuildPour` 重建并检查实际填充，必要时调用 `pcb.getPourFillReadback`。`no-fill` 不是覆铜完成，边框与固定铜 `fill` 不能互换。

`pcb.modifyPour` 不用于已有覆铜改网或改名。需要时在EDA界面处理，随后重建并核对；不建议用自动删除重建冒充无损修改。

位号用 `pcb.modifyComponentAttribute` 修改位置、角度、字体和显隐。普通文字用 `pcb.placeString`、`pcb.modifyString`。底层文字检查镜像及可读性。

`pcb.checkSilkscreen` 只读检查文字、位号、可取得的封装丝印、焊盘开窗和板边。制造图形冲突与源对象候选分别判断；唯一文字来源、歧义匹配和未覆盖图元按实际结果说明，不把候选当确定冲突。参数和支持范围见PCB专题。

## 检查、保存和生产导出

1. `pcb.runDrcDetailed` 用具体对象、网络、规则和图层定位问题，不只看总数。
2. `pcb.runDfm`、`pcb.runSmtDfm`、`pcb.checkManufacturingProfile` 按任务使用。参数档案需有来源，真实板厂叠层、计算和订单分别核对。
3. `pcb.save` 后核对结果；需要确认持久性时关闭重开并比较目标对象。
4. 按任务导出Gerber、BOM、坐标或网表，并按[生产文件操作要求](生产文件操作要求.md)核对单位、层、孔和器件信息。

DRC通过、制造图形检查和生产订单一致性是不同结论。具体设计未提供生产资料时，不由插件补猜板厚、铜厚、Dk或阻抗参数。
