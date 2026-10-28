# PCB低频指令

这里的“低频”表示按特定任务调用，并非无用或未经验证。以下 76 条与[PCB高频指令](commands-pcb-high.md)合计覆盖当前 94 条 `pcb.*` 指令。参数和已知限制见[PCB详细说明](commands-pcb.md)、[PCB几何命令](commands-pcb-special.md)、[网络与导出命令](commands-pcb-special.md)及[下单检查](commands-pcb-special.md)。

| 场景 | 指令 |
| --- | --- |
| 自动布线、扇出与局部几何 | `pcb.autoRouteStart`、`pcb.autoRouteStatus`、`pcb.autoRouteGetResult`、`pcb.autoRouteStop`、`pcb.importAutoRouteSes`、`pcb.exportDsn`、`pcb.getFanoutPlan`、`pcb.fanout`、`pcb.getPadExpansionPlan`、`pcb.expandPads`、`pcb.groupBySchematicRegions`、`pcb.sourceRollback` |
| 自动铜与丝印 | `pcb.getAutoCopperPlan`、`pcb.autoCopper`、`pcb.getPourFillReadback`、`pcb.getNetSilkscreenPlan`、`pcb.generateNetSilkscreen`、`pcb.listStrings`、`pcb.placeString`、`pcb.modifyString`、`pcb.modifyPour` |
| 规则、网络与检查 | `pcb.runDrcDetailed`、`pcb.runDfm`、`pcb.runSmtDfm`、`pcb.checkSameNetPadSpacing`、`pcb.getNetRules`、`pcb.getNetLength`、`pcb.getNetPrimitives`、`pcb.highlightNet`、`pcb.setNetLock`、`pcb.startRealTimeDrc`、`pcb.stopRealTimeDrc`、`pcb.getRealTimeDrcStatus` |
| 网络类、差分对与等长组 | `pcb.createDiffPair`、`pcb.listDiffPairs`、`pcb.deleteDiffPair`、`pcb.createNetClass`、`pcb.listNetClasses`、`pcb.addNetToClass`、`pcb.removeNetFromClass`、`pcb.deleteNetClass`、`pcb.renameNetClass`、`pcb.createEqualLengthGroup`、`pcb.listEqualLengthGroups`、`pcb.renameEqualLengthGroup`、`pcb.deleteEqualLengthGroup`、`pcb.addNetToEqualLengthGroup`、`pcb.removeNetFromEqualLengthGroup` |
| 图层与层叠 | `pcb.getCurrentLayer`、`pcb.selectLayer`、`pcb.setCopperLayers`、`pcb.setLayerVisible`、`pcb.setLayerLocked`、`pcb.listStackingConfigs`、`pcb.getStackingConfig`、`pcb.applyStackingConfig`、`pcb.saveStackingConfig`、`pcb.renameStackingConfig`、`pcb.deleteStackingConfig`、`pcb.setDefaultStackingConfig`、`pcb.addCustomLayer`、`pcb.removeCustomLayer`、`pcb.modifyLayer`、`pcb.setPcbType` |
| 定位、图元与选择 | `pcb.getSelection`、`pcb.select`、`pcb.clearSelection`、`pcb.crossProbe`、`pcb.listLines`、`pcb.modifyLine`、`pcb.listVias`、`pcb.modifyVia`、`pcb.getPrimitivesInRegion`、`pcb.getPrimitiveAtPoint`、`pcb.delete` |
| 工程同步与其他导出 | `pcb.importChanges`、`pcb.exportNetlist` |

`pcb.importChanges` 的现行操作边界见技能入口与[PCB详细说明](commands-pcb.md)。层叠、自动布线和批量几何操作先核对目标及结果。

v0.20.38 暂行政策也在写前检查全部 routeTrack 段、SES 输入段及规划差集段；任一段短于 1 mil（25.4 μm）都拒绝，即使该几何已存在。阈值是插件政策，不是 SDK 下限；细节见[PCB详细说明](commands-pcb.md)。

写入失败后，只有完整文档身份与源码比对确认内容未变时，才跳过恢复写入；命令仍报告失败。无法确认时继续原恢复流程。v0.20.57 移除历史恢复失败造成的持续文档锁；本次失败仍须按结果和诊断核对。

v0.20.58 本地候选的 SES 线宽比较容差仍为 0.001 mil；direct-primitives 的 10.05 mil / 7.536 mil 样例保存重开通过，native-ses 尚未验证。仅 EDA 4.1.78 支持特定填充路径与 DRC 坐标的 mil 归一化；限制见[PCB详细说明](commands-pcb.md)。

v0.20.38 候选中，`pcb.autoRouteStatus` 只查询任务状态并停用自动回灌；禁用结果及槽位处理见[PCB详细说明](commands-pcb.md)。历史回灌后的 DRC 仍须单独运行，不把不可读的违规数当成 0 项。

历史 v0.20.29 记录：首次 SES 导入失败时五条短线段未出现，且恢复未确认。多行 `wire`、`path` 和坐标对输出曾作为格式兼容候选。手工 `importAutoRouteSes` 仍只追加当前板上尚不存在的几何；全部已存在时返回 `imported:false`、`alreadyPresent:true`。旧版 `autoRouteStatus` 曾按 SDK 锁定状态保留锁定图元并替换未锁定铜层路由；当前自动回灌已停用。其他层线和弧保留为非目标内容；重建的 wire/via 不携带原始 `type` 字段，不保证保留全部 wire metadata。

v0.20.36 的本地候选会写前自动选择后端；A15 先加并验证新内容再删旧路由，两种 SES 后端失败均走专用恢复钩子，详细条件见[PCB详细说明](commands-pcb.md)。该候选本地集中回归及最终审查通过，宿主验收待完成。
v0.20.37 仅调整三处内部 JSON 快照的局部深拷贝，不加 polyfill、不改几何或恢复语义；候选本地集中回归及最终审查通过，宿主复测待完成，详见[PCB详细说明](commands-pcb.md)。

成功回执的 `sesGeometryVerified:true` 仅表示 SES 几何读回核对通过；孔径缺省、原有过孔和恢复未确认的处理见上文。失败时可在 `cause.sesDiagnostic` 查看诊断引用、状态和内联记录；诊断阶段有 500 ms 上限，超时或存储失败不会阻断恢复。成功回执不附加大诊断记录。导入失败不再持续锁住后续独立请求，也不会自动重试原输入。

## EDA 版本限制

用户已决定在当前 EDA 4.1.78 暂停下列11项功能。0.20.49 已逐项验证在调用目标接口前拒绝，测试PCB源码保持。保留命令入口及版本保护，不自动尝试旧版替代路径；恢复前须取得适用宿主和逐项验收结果。

EDA 4.1.78 实机调用下列 11 条指令均明确报需要 EDA 4.2。不要把拒绝执行记为功能通过。此前识别的 14 条 4.2 专用指令仍须在真实 EDA 4.2 环境逐项验证；本表所列命令的实际执行、保存和读回尚未验证。

| 类别 | 4.1.78 不支持的指令 |
| --- | --- |
| 当前层 | `pcb.getCurrentLayer` |
| 物理层叠 | `pcb.listStackingConfigs`、`pcb.getStackingConfig`、`pcb.applyStackingConfig`、`pcb.saveStackingConfig`、`pcb.renameStackingConfig`、`pcb.deleteStackingConfig`、`pcb.setDefaultStackingConfig` |
| 实时 DRC | `pcb.startRealTimeDrc`、`pcb.stopRealTimeDrc`、`pcb.getRealTimeDrcStatus` |

## PCB 层/铺铜/过孔/文字

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.addCustomLayer` / `pcb.removeCustomLayer` | 自定义层增删（CUSTOM_1=71 起，只能删 CUSTOM 层） | 设置或核对PCB工作层时使用。 | 只能删除CUSTOM自定义层。 |
| `pcb.modifyLayer` / `pcb.setLayerLocked` | 改层属性（名/类型/颜色/透明度）/ 锁定层 | 设置或核对PCB工作层时使用。 | 写入未知时停止后续写入。 |
| `pcb.listPours` / `pcb.modifyPour` / `pcb.rebuildPour` | 铺铜查/改/重铺（listPours 可按网络/层过滤） | 建立或检查覆铜区域时使用。 | v0.20.42 候选暂拒不同网络/名称（含混合字段）；source/fresh getter 须一致。同值字段跳过，其他允许属性照常核验。不能据此确认填充新鲜度。 |
| `pcb.listVias` / `pcb.modifyVia` | 过孔查/改（网络/位置/孔径/外径） | 核对或调整过孔时使用。 | 写入未知时停止后续写入。 |
| `pcb.listStrings` / `pcb.modifyString` / `pcb.placeString` | PCB 文字（丝印）查/改/放 | 增加图纸说明或丝印时使用。 | 写入未知时停止后续写入。 |
| `pcb.setPcbType` | 板子类型（刚性 NORMAL / 柔性 FPC） | 调整本节已有对象时使用。 | 只接受 normal 或 fpc；SDK 返回 false 时命令报失败。 |

## PCB 网络类/差分/层叠低频项

`pcb.deleteNetClass` 删除网络类，不执行成员网络颜色恢复。EDA 4.1.78 / ACE 0.20.24 的样例曾在删除后保留网络专用颜色，保存重开仍保持。`deleted:true` 不表示恢复到创建前的全部状态；不能据此认定当前所有版本必然保留颜色。


| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.deleteNetClass` / `pcb.removeNetFromClass` / `pcb.renameNetClass` | 网络类删/移出/改名 | 按网络组管理规则时使用。 | 先核对目标并备份。 |
| `pcb.deleteDiffPair` | 删差分对（建/查见 PCB专题） | 配置或核对差分信号时使用。 | 先核对目标并备份。 |
| `pcb.deleteStackingConfig` / `pcb.setDefaultStackingConfig` | 层叠配置删/设默认（建/应用见 commands-pcb.md） | 配置或检查多层板层叠时使用。 | 按配置名称核对目标。 |
| `pcb.removeNetFromEqualLengthGroup` | 网络移出等长组 | 管理需要等长的网络时使用。 | 先核对目标并备份。 |
| `pcb.getNetPrimitives` | 查网络上的全部图元（走线/过孔/焊盘） | 分析指定网络连接对象时使用。 | 按目标实例帮助确认可用参数。 |


0.20.87 的 `pcb.autoRouteGetResult` 已在 EDA4.1.78 完成只读取回的限定验收。外部任务与插件启动任务分别正确报告未知/已知原文档绑定；文件与服务原输出逐字节一致，重复取回保持，原305条数据保持。不自动导入、清线、保存或合并短段。完整导入、DRC与保存重开流程不在本次结论内。

### 丝印直线与圆弧候选（0.20.88历史候选，实际POLY覆盖未通过）

`pcb.checkSilkscreen` 继续使用原参数。顶底丝印层的 SDK 可枚举直线、圆弧加入包围盒候选，与同面文字、位号、直线、圆弧及焊盘比较；铜层及异面对象不参与。缺少API、有效ID、图层或包围盒时明确列为unsupported。

返回的silk-line与silk-arc可能来自封装；尚未证明完整枚举和来源映射。包围盒相近或重叠只表示需要复核，confirmed仍为false，complete仍为false；不代表实际字形、线条墨迹碰撞或完整丝印DRC。制造输出检查仍单独报告。

### B6 同源副本导入验收补充（2026-10-23）

0.20.87 在 EDA4.1.78 的独立同源四层副本中，已完成明确 SES 导入、即时 DRC 和保存关闭重开。新增10段线、4个24/12mil过孔，与取回的原始 SES 几何逐项匹配，容差0.001mil；即时及重开DRC均0。原170条数据在导入后保持；重开后的184条记录仅有四项类别显示配置省略display:true，其他data及header保持。显示等效性未单独验证。网络类有效线宽规则仍报告unknown，不能称规则核对通过。此结果不保证任意PCB布通或生产合格。


### 丝印 Polyline 候选适配（0.20.89限定实机通过）

0.20.89已在EDA4.1.78完成三个真实POLY的限定实机及保存关闭重开验收。顶底各一组文字近邻保持未确认候选，远处、异面及铜线排除。178条设计数据在检查期间保持；重开几何保持，四项显示默认值省略及空网默认长度规则补项单列记录。随后曲线POLY已通过单独限定对照；封装完整枚举和精确墨迹碰撞仍未由本次验收证明。

真实 EDA4.1.78 的原生丝印试线存为POLY，未出现在普通Line枚举中。`pcb.checkSilkscreen`新增SDK Polyline整体包围盒候选，参与同面文字、位号、其他丝印及焊盘比较；不拆分路径。SDK若返回丝印Line/Arc，仍作为补充检查。

返回类型新增silk-polyline，coverage增加checkedSilkPolylineCount和unsupportedSilkPolylineCount。来源映射与完整枚举尚未证实；候选confirmed仍为false，整体complete仍为false。铜层与异面排除，制造输出另行检查。0.20.88只有Line/Arc入口，遗漏本次真实POLY；不能作为丝印笔画覆盖验收通过版本。



0.20.89新增圆弧对照已在EDA4.1.78通过。原生圆弧保存为含ARC路径的POLY，正确进入silk-polyline整体包围盒候选，与同面文字及直线返回未确认候选。保存关闭重开后179条data、圆弧路径及候选配对保持；SDK包围盒单边差约0.0000305mil，在0.001mil对照容差内，不称逐位相同。此项不证明精确弧形墨迹碰撞、封装完整枚举或完整B2通过。

## 0.20.90 订单计算集合与SES诊断（限定安装验收通过）

0.20.90已在EDA4.1.78完成限定安装验收：订单额外阻抗计算ID正确单列mismatch，未验证状态保持；SES具体网络类未知原因正确返回，10线4孔与原文件几何匹配，即时及保存重开DRC0。规则未知仍未知。B5器件焊盘双端隔离样例也已通过即时/重开目标DRC核对，311条几何及网络保持，四项显示默认表示变化单列；整板仍25项旧问题。封装丝印坐标映射和网络类继承解析未由本次修复解决。

`pcb.checkManufacturingProfile` 会把仅存在于调用方订单确认记录中的每个阻抗计算ID，作为独立的 `order.calculation.<id>` mismatch返回。两边计算ID需对应；不静默忽略订单额外计算，不修改订单或profile，也不改变计算证据的verified/unverified状态。物理层叠、Dk与真实订单缺项仍按原范围报告未知。

`pcb.importAutoRouteSes` 的widthRuleCompliance.unknowns仍为字符串数组，现按每条线说明网络、图层及可定位原因。状态和违规判据保持，未知规则不会因此变成通过，也不新增持续锁定。NET_CLASS继承和空选择器关系仍未确认，不猜优先级。

B5另完成同导入条件的网络范围对照：原样副本复现目标通孔与两SMD的3项连接报告；仅隔离网络成员的副本即时和保存重开后目标报告均0。几何保持，只四项类别display默认值表示变化单列。该结果支持旧报告与外部同网范围相关；整板仍24项旧问题，器件PAD双端对照随后已通过独立副本保存重开，不称通用连通或整板通过。


## 0.20.91 显式单网规则限定通过；封装枚举未通过

`pcb.checkSilkscreen` 增加独立的封装直线来源检查。插件读取当前文档嵌入封装，并关联实际器件、封装引用和位姿。首批处理局部顶丝印层的简单直线 POLY；局部底丝印、复杂路径或来源不明逐项报告未覆盖。封装来源身份保留器件ID、封装UUID和局部图元ID，不冒充板级SDK图元ID。近邻仍是未确认候选；制造输出检查单独报告，完整检查状态仍为false。

直线变换已用隔离封装的五种摆放与官方Gerber逐笔核对，含底层37°，保存重开实际几何保持。底层先镜像局部y，再旋转和平移；不修改通用分组包围盒函数。正式安装版的嵌入封装列表实际为空，未得到30笔丝印；已如实保留五组件未覆盖信息，不算B2验收通过。

网络属于类但自身明确指定的简单TRACK规则，在EDA4.1.78已确认结构下，源码、SDK所属类和规则值一致时可以确认。空选择器继承、复杂选择器、冲突或来源不足仍为unknown。插件自动核对，不要求调用方再填已能读取的规则。DSN、SES和制造参数核对共用此解析；范围内偏离首选值不算违规，DSN默认值差异仍独立报告，routingConstraintsComplete仍为false。


## 0.20.92 项目库封装来源补充（限定实机验收通过）

0.20.92已在EDA4.1.78完成正式指令验收：当前项目库精确补读得到5个器件的30笔直线，与已核对的五姿态制造几何一致。保存、关闭、重开后190条设计数据、来源身份、直线和候选保持，检查期间数据保持，task0。局部layer4、复杂路径及完整B2仍未通过。显式单网规则在本版读回保持正确，空选择器继承仍unknown。

`pcb.checkSilkscreen` 在文档嵌入列表缺少实际器件引用的封装时，从当前工程库按已核对的封装UUID补读。插件自己确认工程库身份、器件引用、位姿和源码身份，并在检查结束重新读取。来源区分文档嵌入与工程库；不回退个人、系统或公共云库，不覆盖已发现的冲突。读取结果不明确时保留逐器件未覆盖提示，不把空列表当作没有丝印。

来源已确认的局部顶丝印简单直线POLY继续按端点变换和半线宽计算范围。复杂路径、局部底丝印及完整枚举仍未覆盖。近邻候选confirmed仍为false，制造输出另报，完整检查状态仍为false。0.20.91的显式单网TRACK已通过20/30mil实机对照及超宽SES写前拒绝，本版保留。


## 0.20.93 多段封装丝印与底层分组修正（限定验收）

`pcb.checkSilkscreen` 补充来源已确认的封装局部layer3/4直线路径。支持 `[x0,y0,"L",x1,y1,x2,y2,...]`，一个L后连续有限坐标对，重复起点表示闭合。每个POLY保留一个来源身份，返回有序局部/全局points、closed和segmentCount；a/b表示首末点。范围包含全部顶点及半线宽，底层器件交换局部顶底丝印的制造面。曲线、未知命令及非法路径整条列为未覆盖。近邻仍是包围框候选，confirmed和整体complete保持false。

独立夹具的40条路径、60段线已逐段匹配实际Gerber，含顶底0°、90°和底层37°。0.20.93正式指令也已取得全部40条路径和60段，点序、层、来源、包围范围及近邻候选符合对照；保存关闭重开后保持。190条设计数据和44条封装数据保持，两次只读检查未改数据，任务0。此结果限于已覆盖直线路径，不代表完整B2。

`pcb.groupBySchematicRegions` 修正偏心底层封装范围：先镜像局部y，再旋转和平移。提取方法仍是既有粗略范围，不代表所有实体精确边界。源码测量分支已通过回归；实机嵌入枚举为空时仍使用SDK回退，不把它称为源码分支实机通过。

EDA4.1.78的隔离规则对照及保存重开显示：显式选择25～35mil类规则的20/40mil线均报线宽错误；同类中保留默认选择的网络未报这些线宽错误。此对照不能确定preferred，也不能推广到其他配置；空选择器继承保持unknown，不自动采用类推荐线宽。


## 0.20.94 封装圆弧丝印（限定实机验收通过）

`pcb.checkSilkscreen` 的封装来源通道增加POLY的ARC及L/ARC混合路径。ARC参数为角度制带符号扫角，格式为 `[x,y,"ARC",angle,endX,endY]`；底层镜像后扫角反号。每条POLY保留一个来源身份；local/global的segments区分直线和圆弧，圆弧包含起终点、圆心、半径与扫角。points仅表示路径节点，不是圆弧采样折线。包围范围使用每段圆弧经过的象限极值，再外扩半线宽。

非法或未知指令整条列为未覆盖，不保留有效前缀；CARC、贝塞尔、整圆及重合端点圆弧仍未覆盖。不根据填充多边形说明补隐式闭合线，closed按实际首末节点判断。既有单段、多段直线输出保持，所有近邻仍是包围框候选，confirmed和整体complete保持false。制造输出解析器仍单独披露不支持的G02/G03，不因来源通道支持ARC就称制造检查完整。

五姿态、局部3/4层的25段弧及10条附加直线已找到唯一制造对应，含90°、-90°、180°、270°及-172.3719°混合路径。圆心、方向、半径、扫角与范围在制造量化误差内匹配，保存重开后保持；0.20.94正式指令已取得65条路径、95段（含25弧），全部弧几何、来源和范围符合当前实际Gerber对照。保存关闭重开后190条设计数据、49条封装数据及来源通道和候选保持，两次检查期间数据保持，任务0。验收开始前一器件已移位，未回退该位置，已重新导出当前制造文件核对；不是放宽几何容差。夹具重开有四类显示默认项省略和空网默认长度容差补项，已单列，其余设计数据及49条封装数据保持。


## 0.20.95 制造圆弧与旋转阻焊宏（限定实机验收通过）

`pcb.checkSilkscreen` 的manufacturing通道补充FSLA45毫米坐标、G75多象限、圆形C光圈的G02/G03普通圆弧描边。方向和XY按Gerber模态维护，I/J须本条明确给出，按起点相对偏移解码，不继承上一段。包络包含分段实际弓高、端点半径差及数值余量，返回近似摘要；确认/候选仍按几何内外界判断。不会把弦线当圆弧，不能因下界为空而报没有冲突。

`maxEnvelopeErrorMil` 是圆弧中心线模型的补偿量，包含半径残差、折线弓高和数值余量。它用于胶囊半径收缩或扩张，不包含胶囊圆帽的多边形近似，也不是最终墨迹多边形的总误差上限。最终几何按inner/outer包含关系解释。

已核对body的RoundRect宏按实际四圆、四边和填充四边形处理，覆盖旋转参数，不把它拟合为轴对齐矩形。只支持该明确宏定义；未知宏、G74、区域圆弧及圆弧GKO仍报告未覆盖，维持后续解析状态，区域含未支持圆弧时整区域不输出残缺轮廓。

来源通道0.20.94已通过的65路径95段保持；manufacturing仍独立报告。制造层在已支持范围内解析完整，不代表完整来源枚举、精确字体或整板生产验收。0.20.95正式指令已在EDA4.1.78完成验收：五层制造解析完整、25弧，来源通道65路径95段保持；保存关闭重开后190条设计数据、49条封装数据、来源通道及实际冲突几何保持。两轮检查均保留3个确认的面/类别汇总项和1个待复核汇总项，任务0；不称整板通过。本夹具实机耗时约20.2/21.6秒，不用离线约1.47秒替代实机耗时。规则继承等已列未知项不因此变为通过。


## 0.20.96 制造区域辅助定位（限定实机验收通过）

`pcb.checkSilkscreen` 新增独立的manufacturingSourceLocations通道。它按原制造汇总项与位置框查询同面附近源对象，关联bucket、conflictIndex、areaIndex；SDK对象保留实际ID，封装路径保留componentId/footprintUuid/localPrimitiveId等复合来源。无位置框时返回unavailable，不猜位置。搜索半径为minClearance加0.01mil，结果披露searchMarginMil；候选距离是bboxDistanceToLocationMil，不能当作制造距离。

所有定位项仅为附近来源候选。一个命中为candidate，多个为ambiguous，零个或位置不可用为unavailable；候选对象的confirmed始终false，通道complete始终false。available仅表示制造汇总数组结构可读，不表示制造覆盖完整，仍须检查原manufacturing.complete。唯一bbox命中也不证明唯一制造贡献，候选可能对应已被clear去除、未形成最终油墨或仅大包围框覆盖的对象。multi焊盘可在两面作为附近铜对象，不能冒充真实阻焊开窗归属。制造位置截断标记保持，不改变原制造几何、距离或确认状态。

原manufacturing中的confirmedConflicts/potentialConflicts数组按面与类别汇总，计数不是独立碰撞处数；其中位置框也不是源对象对。原confirmedConflictCount保持兼容，其含义为确认的汇总项数。来源POLY的非3/4层记录计入excludedOutOfScopePolyCount，表示映射到实例后的范围外记录数；非法层仍unsupported，不把layer48外形当未支持丝印。0.20.96已在EDA4.1.78完成正式指令和保存关闭重开验收。四个位置框分别有1、1、2、1个候选，另一个无位置框的汇总项返回unavailable；候选身份、范围和距离已核对。来源65路径95段保持，5条非丝印POLY实例记录正确排除。190条设计数据、封装读回和原制造冲突几何保持；后台任务0。两次检查约18.1和19.1秒。单个候选仍不证明唯一来源，完整B2仍未通过。


## 0.20.97 空选择器默认线宽（限定实机验收通过）

DSN导出、SES导入线宽核对及制造参数对照共用的解析，新增EDA4.1.78严格空NET选择器分支。网络属于类但NET选择器为空、SDK网络Track为default，且来源身份、类关系、默认与类规则均可确认时，采用全局DEFAULT TRACK的min/preferred/max，不采用类TRACK。

本分支当前支持mil单位、单行开启TRACK、已启用信号层，以及ruleOrder=4、parent=null、ruleKeyValue/copperValue/innerPlaneValue为空的已验证结构。缺少选择器、显式TRACK为default字符串、额外字段、重复或冲突记录、其他版本和未确认结构仍为unknown。调用方不需要另填插件能可靠读取的规则。

独立实机对照将默认5/10/100改为22/27/38mil，空选择器网络的原生DRC明确采用22~38mil，DSN导出27mil；显式类规则保持25/30/35mil。保存关闭重开结果保持。此证据不证明交互布线的实际落线首选值或边界等值接受；preferredMil仍为源码配置值，供DSN比较。未改变DSN、导入几何、自动回灌策略或持续锁定策略。0.20.97正式指令已在EDA4.1.78验收：DSN网络27/30mil匹配；结构默认27.05与首选27的差异仍独立报告。20/40mil SES均零写拒绝，随后27mil正常导入，无持续锁。保存关闭重开后175条data保持，task0。测试板DRC仍13项，新增独立测试线有同网连接报告但无线宽违规，不称整板通过。routingConstraintsComplete:false保持。

## 0.20.98 板边距离见证（限定实机验收通过）

`pcb.checkSilkscreen`对已报告的silk-to-board-edge增加可验证的距离位置。原距离上下界、confirmed/potential及类别计数保持。locationKind为distance-witness，locationEnumerationComplete为false，locationBoundsMil仅包围两个见证点；重合时允许零面积。

locationWitness说明distanceBound为lower、silkGeometry为outer-envelope，给出silkPointMil、boardPointMil及measuredDistanceMil。kind区分真实交点intersection、板边点处于最终油墨集合内的contained-point及分离的nearest-points。使用dark/clear处理后的最终外包络，不声称是精确原始油墨边界，也不反推源图元归属。仅容差判零时保留真实近点距离，不伪造交点；无法验证时保持位置不可用。

来源定位通道传递见证类型和非完整枚举信息，继续只返回附近包围盒候选，confirmed仍false。单个见证不代表只有一处接触或覆盖全部冲突；候选bbox距离不是实际丝印到板边距离。其他制造类别和Gerber格式覆盖范围保持。0.20.98已在EDA4.1.78完成正式指令及保存关闭重开验收：板边见证(1200,196.70061870274318)mil与独立几何一致，关联一个附近来源候选。原3个确认汇总、1个潜在汇总及距离保持；190条设计数据、封装读回和来源候选保持，task0。单个见证仍不是全部接触位置或唯一归属；完整B2仍未通过。

## 0.20.99 丝印定位候选角色（限定实机验收通过）

`pcb.checkSilkscreen` 的 manufacturingSourceLocations 在原 candidates 中增加 role，并在每个 location 中增加 roleGroups。丝印文字、位号、支持的丝印图元和封装笔画归入 silkscreen-source；阻焊类别中的附近焊盘归入 mask-opening-owner-candidate。

roleGroups 用 candidateIndices 指向原 candidates，不重复对象身份。每组分别返回 candidateCount 和 unavailable/candidate/ambiguous；缺失某个角色的候选不表示没有制造风险。板边及板外类别只提供丝印组。原平铺 status 仍按全部候选统计，按角色定位时读取 roleGroups。

焊盘候选依据的是铜对象包围盒，不是已确认的阻焊开窗归属。两组各一个候选，也不能认定为实际冲突对象对。confirmed 仍为 false，complete 仍为 false；原制造判定、位置和距离保持。候选 bbox 距离不是候选之间的实际间距。本版已在 EDA4.1.78 完成正式指令及保存关闭重开验收：R2 位号和焊盘分为两组各一个候选，原制造判定保持；190 条设计数据、49 条封装有效数据保持，任务数为 0。完整 B2 尚未通过。

## 0.20.100 封装圆弧与板边参与证据（限定实机验收通过）

`pcb.checkSilkscreen` 新增独立的 footprintArcBoardParticipation。它使用同次稳定封装来源和导出的 Gerber，核对已支持的单段封装 ARC 中心线与简单直线板框的交点。它不使用包围盒或外包络见证代替源中心线交点。

同面制造圆弧需为 dark 圆形光圈笔画，端点、圆心、半径、方向、扫角和线宽均匹配。量化容差依据导出坐标精度推导。零匹配、多匹配或数值不可靠时明确披露。实际制造图元引用只用于同次报告定位，不是 EDA 图元 ID。 sourceIntersectionPointsMil 单独保留可靠的源交点，即使制造匹配不确定也不丢失。witnesses 是匹配后逐点贡献核对；contactEnumerationComplete 为 false，未解决的接触情况通过 unresolvedContactReason 披露。

制造贡献为 verified-at-witnesses 时，交点严格位于完整制造 lower 内，且在仅省略匹配制造图元、按原极性顺序重放后的 upper 外。该结果只证明匹配制造图元在所列交点的必要贡献。sourceMapping 为 geometry-correlated，uniqueSourceAttribution 始终为 false；不表示 Gerber 带有唯一源身份，也不把候选升级为 confirmed。

本通道只处理已验证子集，不覆盖文字字形、完整线宽间距或所有丝印图元。无交点不等于没有线宽接触或其他制造风险。无关阻焊层不完整时可单独核对完整同面丝印层与板框，但原 manufacturing.complete 保持。预算异常沿用现有失败处理，不能当作无冲突。

原制造判定、距离、角色候选及完整性状态保持。已在 EDA4.1.78 完成正式指令及保存关闭重开验收：20 条单段圆弧中，目标 e95 的两个源中心线板边交点及匹配制造圆弧贡献与本地验证一致；190 条设计和 49 条封装有效数据保持，任务数 0。原制造判定、几何位置及候选定位保持；五个光圈定义参数变化已另存，尚无同次导出使用证据，不称完整报告相同。完整 B2 尚未通过。

## 0.20.101 制造丝印与开窗参与证据（限定实机验收通过）

`pcb.checkSilkscreen` 新增独立的 manufacturingMaskOverlapParticipation。它使用同次导出的完整丝印层和阻焊层，为原有已确认的正面积相交区域补充严格内部见证。只核对已有支持的 Gerber 子集。

见证点从最终 lower 的真实交集取得，并核对两层内部成员关系和边界裕量。逐层列出该点可能由 dark 图元覆盖的制造引用。对所有覆盖候选逐个省略，并按原极性顺序重放。候选自身 lower 内、省略后的最终 upper 外且远离边界，才证明该点的必要贡献。两侧各恰好一个已证明必要贡献者时返回 verified-at-witnesses。原始覆盖候选可以多个，clear 后重画不因原始候选数而提前拒绝。

无可靠内部点、重复覆盖、图元不唯一、贡献不能确认、缺层或解析不完整时，返回具体原因。预算异常传播，不当作无冲突。输入和原 manufacturing、来源定位候选、圆弧板边参与报告保持。

制造引用的 layer、fileName、contentBytes 和 shapeIndex 只定位同次导出的图元，不是 EDA primitiveId。uniqueSourceAttribution 为 false。来源角色组仍为候选，每组单候选不能确认实际 EDA 对象归属。一个内部见证不表示全部交叠位置或所有对象对已枚举。

本通道不扩展到文字字形身份、焊盘有效开窗归属、完整线宽间距或全格式支持。已在 EDA4.1.78 完成正式指令及保存关闭重开验收：底面见证和 GBO23/GBS1 双侧必要贡献与本地验证一致，190 条设计和 49 条封装有效数据保持，任务数为 0。原制造几何判定、来源候选和圆弧通道保持；五个光圈定义参数变化仍逐次单列。完整 B2 尚未通过。

两侧 witness.silk/mask 分别给出 darkUpperCandidates、necessaryContributorCount 和 necessaryContributorRefs。uniqueDarkCoverage 只说明原始覆盖候选事实，最终证明看 necessaryContribution。省略后 upper 为空时 omittedFinalUpperEmpty=true，边界距离为 null，表示没有边界。

内部点采用有限扫描候选，不保证找到所有可验证的点。not-verified 不表示不存在可验证的制造图元对。

## 0.20.102 焊盘与制造开窗几何关联（限定实机验收通过）

`pcb.checkSilkscreen` 新增独立 padMaskOpeningAssociations。它连接稳定封装源 PAD、实际 PAD_NET 编号/局部ID与运行时器件焊盘，核对普通单面 SMD 矩形的制造开窗。编号或归属不唯一时不任选。

模型采用源 RECT 正宽高、零圆角和目标面的显式正 solder expansion。中心取实际高精度铜 bbox，方向取实际 rotation；按源尺寸重算投影 bbox 并复核。SDK 粗坐标和粗尺寸不用于精确几何，也不据此放宽容差。PAD_NET 非空 attrsMap、已识别实例 PAD 覆盖、特殊 PAD、孔和未解释几何修正返回未支持原因，不推断已穷尽宿主全部覆盖机制。

同次完整 GTS/GBS 的 dark RoundRect flash 需匹配中心、矩形核角点和扩张半径。核角点允许起点、遍历方向及等价矩形表示；量化容差依据导出格式。matches 分别给出 geometry-correlated、not-matched、ambiguous 或 geometry-match-uncertain，保留实际 runtimePadId、源身份及全部匹配制造引用。

只有匹配到 manufacturingMaskOverlapParticipation 已证明必要贡献的同次开窗引用，才链接该 witness，并核对同一见证点位于预测开窗模型内。前后组件焊盘快照、PCB与封装源均需稳定；预算异常传播。输入和原制造、来源定位、圆弧及制造交叠报告保持。

几何关联不证明唯一来源，uniqueSourceAttribution 为 false，原候选 confirmed 仍为 false。这个模型不证明由 bbox 唯一恢复了铜轮廓，也不证明文字来源或完整冲突对象对。已在 EDA4.1.78 完成正式指令及保存关闭重开验收：五姿态十焊盘的开窗几何关联与本地验证一致，R2的1号焊盘对应 GBS1 并链接原内部见证；190条设计和49条封装有效数据保持，任务数0。原制造几何、来源候选、圆弧及交叠参与报告保持；五个光圈定义参数变化仍逐次单列。完整 B2 尚未通过。

模型保留源两面扩张值、本次选用字段及实际面。当前按实例实际面选择同名源字段，底面局部面翻转语义尚未独立验证。制造匹配只证明所用数值模型与本次 flash 一致，不验证非对称扩张的一般字段映射规则。

## 0.20.103 局部顶层SMD阻焊扩张面映射（限定实机验收通过）

`pcb.checkSilkscreen` 修正 padMaskOpeningAssociations 对底面组件的扩张字段选择。对于已验证的封装局部铜层1、普通无孔RECT SMD，源 topSolderExpansion 随组件实际铜面生效。顶面实例匹配GTS，底面实例匹配GBS，均采用源 topSolderExpansion；不按实际底面改取源 bottomSolderExpansion。

sourcePadModel 保留两面源值，并返回 localCopperLayerId=1、expansionMapping=local-layer1-follows-component-side、selectedExpansionField=topSolderExpansion。完整中心、核角点、扩张半径匹配及唯一匹配后的见证成员核对保持。范围内删除旧的同名全局面选择假设，modelAssumptions为空数组。

该映射已用独立隔离工程验证：源3/7和仅bottom改为11的3/11，顶底五姿态十PAD在初始及保存重开后的四份Gerber均使用3mil扩张。0.20.102会漏掉其中六个底面关联，属插件选择错误。本版已在EDA4.1.78完成原工程、3/7及3/11隔离工程的正式指令与保存关闭重开验收：两种非对称配置均十PAD关联、六个底面关联恢复，源top扩张模型与制造一致。各次检查及本轮保存重开190条设计/49条封装有效记录保持，任务0。原制造几何及其它来源通道保持；完整B2仍未通过。

局部铜层2、多层、缺失或非法源层明确列入skipped。当前结论不解释getter局部/全局语义，不外推到未验证PAD路径。原覆盖检查、歧义、稳定性和预算处理保持；geometry-correlated仍不证明唯一来源，uniqueSourceAttribution=false，原候选confirmed不升级，完整B2尚未通过。

## 0.20.104 局部底层SMD开窗关联（限定实机验收通过）

`pcb.checkSilkscreen` 的 padMaskOpeningAssociations 增加封装局部铜层2的普通无孔、NORMAL、零圆角RECT SMD。局部1仍用源 topSolderExpansion，实际PAD铜面应与组件面相同。局部2用源 bottomSolderExpansion，实际PAD铜面应为组件反面。严格核对组件层、局部层和实际PAD层，候选side及GTS/GBS目标采用核对后的实际PAD面。

sourcePadModel 保留两面源扩张值。局部2返回 localCopperLayerId=2、expansionMapping=local-layer2-opposite-component-side、selectedExpansionField=bottomSolderExpansion。局部1原字段和值保持。完整中心、核角点、半径、稳定来源、PAD_NET身份、精确铜bbox和实际旋转核对保持；只链接同次制造报告已证明的同面见证，无见证不补造旧链接。

隔离工程源top3/bottom7及3/11，只改变两条源PAD局部层为2。五姿态十PAD的初始和保存重开导出均为GTS6/GBS4，半径分别全7mil和11mil。新版本已完成原工程、局部2源3/7及3/11两隔离工程的正式指令和保存关闭重开验收。两种局部2配置均十PAD关联、六顶四底，与源bottom7/11和真实制造一致；无交叠见证时两类见证引用均为空。各次检查及本轮新版保存重开190条设计/49条封装有效记录保持，任务0。完整B2仍未通过。此证据不解释getter字段的通用局部/全局语义，不覆盖多层、通孔、特殊PAD、非零圆角或其他形状。

制造层距离计算仅增加保守单轴包围盒下界剪枝；保留整体交集、遍历顺序、精确线段距离、零值规则和预算异常传播。完整最短距离及报告含义保持，不按检测阈值截断。离线速度不代替宿主验收；本次宿主各阶段耗时已单列于v104-final-audit.json，仅代表本轮相同夹具实测。

缺失或非法源层、多层及无法可靠匹配项继续公开skipped原因。geometry-correlated仍不证明唯一源身份，uniqueSourceAttribution=false；原候选confirmed不升级，完整B2尚未通过。

## 0.20.105 普通圆形SMD开窗关联（限定实机验收通过）

`pcb.checkSilkscreen` 的 padMaskOpeningAssociations 增加普通无孔NORMAL圆形SMD。源defaultPad为ELLIPSE，有限正width与height严格相等；实际焊盘类型也须为ELLIPSE。沿用局部铜层1取源top、与组件同面，局部2取源bottom、与组件反面的映射。显式正扩张、PAD_NET身份、覆盖、唯一编号、实际铜面和读回稳定检查保持。

圆形使用独立模型。sourcePadModel为shape=ELLIPSE、diameterMil及原层/扩张来源字段；精确铜bbox两轴尺寸须与源直径一致，中心来自精确bbox。运行时粗getter尺寸不作为源直径；rotation继续参与快照稳定核对，圆形几何不依赖旋转。不要求ELLIPSE无关radius字段为0，不把真正不等径椭圆当圆形。原RECT对象、四角核和完整关联输出保持。 圆形派生圆心、正开窗直径及四个外边界坐标必须有限；计算溢出会明确列入skipped，不生成候选。

圆形匹配同面dark单正参数实心C flash的完整中心及开窗直径，开窗直径=铜直径+2×所选扩张。geometryChecks使用circleOnly和中心/正直径检查，不伪造RoundRect四角。原C直径词元仅用于追溯与格式判断，不按文本小数位数放宽容差。

圆直径量化独立取证：源理想0.968375mm导出0.96838，1.07823254mm导出1.07823，初始及保存重开保持。此导出路径的C直径采用已验证的五位毫米最近舍入误差界，半量化0.000005mm再加浮点余量。它独立于FS45中心坐标精度。1、1.0000、1.00000采用同一规则；非已验网格只在与源模型纯浮点尺度一致时作精确数值匹配，否则保留精度未确认原因。同中心未解决候选不得被忽略后使另一个候选获得确定关联。

必要贡献及见证仍要求唯一可靠几何匹配、同面、精确制造引用一致、制造必要贡献已确认和点严格位于源开窗圆内。真实8份圆形导出当前没有mask交叠见证，witnessLinks与necessaryMaskReferences应为空，不补造旧链接。

四个隔离副本覆盖源3/7、3/11与两组小数直径，初始/重开8份导出均十PAD、GTS5/GBS5逐一核对。新版已完成原矩形工程、圆形3/7与3/11及小数直径向下样本的正式指令和保存关闭重开验收。圆形副本各十PAD关联、五顶五底，分数源直径与制造舍入匹配；当前无mask交叠见证时两类链接均为空。四工程本轮190条设计/49条封装有效数据保持，任务0。非网格精确数值回退和异常输入分支为本地回归证据，本轮宿主导出为已验五位网格。完整B2仍未通过。真椭圆、长圆、多层、通孔、特殊覆盖和文字来源仍未覆盖；geometry-correlated、uniqueSourceAttribution=false及complete=false保持，完整B2尚未通过。
