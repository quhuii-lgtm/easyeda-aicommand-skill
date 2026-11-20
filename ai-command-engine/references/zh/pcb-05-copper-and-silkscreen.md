# PCB 5 · 覆铜与丝印

具体参数、默认值、回包和示例以目标窗口的 `__help` 为准。

## 过孔和铺铜

涉及电源、地或参考面时，按[实铜接入验收](pcb-power-ground-connectivity.md)检查实填、热焊与主干接入。新增铜区和刷新既有填充分开记录。

- 信号孔、地孔、载流孔和散热孔分别检查。
- `placeVia` 会读回过孔并请求飞线计算；`connectivityVerified:false` 表示跨层连通尚未确认。刷新后用连接检查核对实际状态。
- 全局供电、地和铺铜按项目计划实施。通常在布局和主要走线稳定后完成最终铺铜。多个网络的扇出计划逐个生成和执行，每次完成后重读障碍和可用路径。
- 减少换层时保留必要的返回和散热路径。
- 并联孔的能力不能简单按数量相乘。
- 盘中孔须由封装和选定制造工艺支持。
- 铺铜检查网络、层、边界、间距和连接方式。
- 检查优先级、孤岛处理和制造优化设置。
- 热焊盘连接兼顾电流、散热和焊接。
- 需要用当前走线验铜时，按项目允许的范围刷新既有填充。自动重建已开启时先读回实填，再检查实际铜面是否连续。

## 丝印和接口标识

- 画布整层显示色可用 `pcb.getSilkscreenColors` 读取、用 `pcb.setSilkscreenColor` 设置。`side` 可选 `top`、`bottom`、`both`，默认 `top`；`color` 使用 `#RRGGBB`。此设置只改显示色，不改生产或 3D 颜色，也不会自动保存。调用 `pcb.getSilkscreenColors` 读回确认；完整参数和回包以 `__help` 为准。
- 分别检查独立文字、器件位号和封装内标识。
- 按实际工艺检查字高、笔画宽度和最小间距。
- 放大文字后，重新检查文字与焊盘、阻焊开窗、板边和相邻文字的间距。
- 底面文字按实际底面视图检查方向和针序。
- 反相文字检查背景范围和字符是否完整。
- 工具不能修改器件属性时，列出未完成对象。
- 尺寸检查通过不能代替图面检查。

## 放置 PCB 图元和图片

这些命令用于非电气绘图对象。铜层电气布线使用 `pcb.routeTrack`；`pcb.placeLine` 用于非铜层绘图线，返回 Polyline 图元。先用 `pcb.listLayers` 核对目标层，再创建或修改图元、重新列出并核对回读属性。保存重开后再确认图元是否持久保留。

已注册的图元放置或属性修改可用 `pcb.runEditBatch`：先检查默认预演，核对目标和步骤顺序，再明确请求执行。命令不接受图片放置或电气布线，并将步骤放入同一撤销组；它不运行 DRC。只有失败步骤确认未写入且撤销组恢复结果已核验时才回退；`partial` 或 `unknown` 必须保留现场并先检查，再决定后续操作。批处理完成后的撤销或重做需在 EDA 界面操作。

- 铜层圆弧使用 `pcb.placeArc`。非铜层曲线使用 `pcb.placePolyline`，路径段可包含 `ARC`。`pcb.placeLine` 的两点直线也以 Polyline 对象表示。
- 固定实心填充图元使用 `pcb.placeFill`。目前不支持网格填充或自定义填充线宽。固定填充不能替代覆铜。
- 禁止区或约束区使用 `pcb.placeRegion`。禁止区不保存自定义名称；只有 `ruleType` 包含 `9` 的区域可设置名称，这不代表外部设计规则已绑定。
- 长度或角度标注使用 `pcb.placeDimension`；角度按度输入。本次版本不创建或修改半径标注；可用 `pcb.listDimensions` 读取已有半径标注。
- `pcb.placePad` 不支持真椭圆：保存重开会将其变为圆形。需要圆形或长圆时使用对应形状。
- `pcb.placeImage` 接收 PNG 数据并描摹为单色矢量轮廓，不保留彩色位图。使用 `pcb.listImages` 或 `pcb.modifyImage` 查看或修改已有图片的位置和显示属性。

完整参数和枚举值以目标 PCB 页中的 `__help` 为准。

## 覆铜与丝印

用 `pcb.pourCopper` 或 `pcb.modifyPour` 创建或调整直边多边形。先核对图层、网络和顶点，再重建指定铜区并读回实填路径。需要指定铜区独有的直连或热焊规则时，在 EDA 铜区属性中设置。用 `pcb.reviewCopperShape` 检查指定铜区的已支持填充几何和所选截面；判读测量前先看覆盖范围。截面只测所选位置，不搜索整块铜区的最窄处；锐角候选仅覆盖外轮廓上直线相接的角。

`pcb.pourCopper` 建立覆铜边框；用 `pcb.rebuildPour` 重建并检查实际填充，必要时调用 `pcb.getPourFillReadback`。`no-fill` 不是覆铜完成，边框与固定铜 `fill` 不能互换。

`pcb.modifyPour` 不用于已有覆铜改网或改名。需要时在EDA界面处理，随后重建并核对；不建议用自动删除重建冒充无损修改。

位号用 `pcb.modifyComponentAttribute` 修改位置、角度、字体和显隐。普通文字用 `pcb.placeString`、`pcb.modifyString`。底层文字检查镜像及可读性。

`pcb.checkSilkscreen` 只读检查文字、位号、可取得的封装丝印、焊盘开窗和板边。制造图形冲突与源对象候选分别判断；唯一文字来源、歧义匹配和未覆盖图元按实际结果说明，不把候选当确定冲突。参数和支持范围见PCB专题。

### 局部铜皮

计划按网络和铜层分组，不会把不同网络合并为同一铜片。当前板框解析只接受已核实的单一闭环；曲线、多环或障碍信息不完整时，不把部分计划当成安全几何。

`pour` 可能被覆铜规则裁剪成边框或零填充。新建或重建后可用 `pcb.getPourFillReadback` 核对填充对象、父边框、网络和图层。读回路径非空不代表几何正确或达到制造要求。执行回执或填充读回未知时停止依赖结果；保留已创建边框并先检查图纸，不自动重建或删除。`executable:true` 仅代表计划检查允许执行，不保证宿主实际生成填充。

新建覆铜可指定网络；现有覆铜改网或改名的自动化路径尚不支持。若在 EDA 中手动处理，操作后须核对覆铜顺序、重建结果和实际填充。不要把自动删除再创建覆铜描述为无损改网方案。

### 焊盘外扩和网络丝印

焊盘外扩只支持计划明确覆盖的焊盘形状。曲线轮廓可能是近似值；须保留计划的完整轮廓和分片，不能删减。阻焊外扩最终仍要核对生产输出。

网络丝印只是文字对象。核对目标焊盘网络、文字层、旋转和底层镜像，并在执行后检查与焊盘、板框和其他文字的视觉间距。

官方接口修改图层激活时的显示色；非激活暗色保持 EDA 设置。

## 丝印间距检查

`pcb.checkSilkscreen` 分别检查当前 PCB 中可读的丝印对象和制造输出。检查范围、参数和返回字段以当前帮助为准。SDK 来源可能包含直线、圆弧、Polyline；封装局部几何和板级对象的来源身份应区分，不要将局部图元 ID 冒充板级 SDK ID。

SDK 候选检查会把同面丝印文字、位号、线、弧、Polyline 和焊盘按可用几何进行近邻筛查。包围盒重叠只代表需要复核，不是精确字形或墨迹碰撞。来源映射不清、对象枚举不全或几何不支持时，应读 `coverage`、`unsupported` 和完整性状态；候选的 `confirmed:false` 或整体 `complete:false` 不能报告为通过。铜层和异面对象不参与同面比较。

制造通道解析已支持的 Gerber 图层并报告面、类别和几何冲突；制造输出结果与 SDK 候选分开阅读。制造输出完整只表示受支持语法解析完整，不表示所有字体、宏、圆弧、封装来源或整板制造规则均已覆盖。区域汇总数不一定等于独立碰撞数量；辅助位置框或附近来源命中只是候选，不证明唯一制造来源。制造通道和 SDK 检查均不会自动修改图纸。

## 命令索引

| 任务 | 命令 | 用途 |
| --- | --- | --- |
| 画布丝印显示色 | `pcb.getSilkscreenColors`、`pcb.setSilkscreenColor` | 读取或设置顶面、底面或双面画布显示色；不改生产或 3D 颜色，不自动保存；设置后读回确认。 |
| 位号与丝印 | `pcb.modifyComponentAttribute`、`pcb.checkSilkscreen` | 调整位号属性或检查丝印候选。位号修改不重新编号；丝印结果可能不完整，候选不等于已确认碰撞。 |
| 覆铜 | `pcb.pourCopper`、`pcb.listPours`、`pcb.rebuildPour` | 创建、查看和重建覆铜。`pourCopper` 只建立边界，需重建并读回填充结果；`no-fill` 不表示铺铜完成。 |
| 铜形、文字与丝印 | `pcb.getAutoCopperPlan`, `pcb.autoCopper`, `pcb.getPourFillReadback`, `pcb.getNetSilkscreenPlan`, `pcb.generateNetSilkscreen`, `pcb.listStrings`, `pcb.placeString`, `pcb.modifyString`, `pcb.modifyPour` | 先检查计划或目标，写入后核对。 |
| 铜形检查 | `pcb.reviewCopperShape` | 检查指定覆铜和可选截面；先查看覆盖范围。截面不是全区最窄处搜索；锐角候选仅覆盖外轮廓上直线相接的角。结果不证明电气连通或无孤岛。 |
| PCB 绘图图元 | `pcb.listArcs` / `pcb.placeArc` / `pcb.modifyArc`、`pcb.listFills` / `pcb.placeFill` / `pcb.modifyFill`、`pcb.listRegions` / `pcb.placeRegion` / `pcb.modifyRegion`、`pcb.listPolylines` / `pcb.placePolyline` / `pcb.modifyPolyline`、`pcb.listDimensions` / `pcb.placeDimension` / `pcb.modifyDimension`、`pcb.placeLine` | 用于非电气图形和标注。圆弧仅支持铜层；非铜层直线和曲线使用 Polyline。固定填充仅实心；禁止区不保留自定义名称。长度和角度标注可创建或修改；本次版本的半径标注只读。电气布线使用 `pcb.routeTrack`。 |
| 图元批量编辑 | `pcb.runEditBatch` | 先预演图元放置或属性修改步骤，核对目标和顺序，再明确执行为同一撤销组。仅确认本步未写且组回退已核验时才自动回退；`partial` 或 `unknown` 保留现场。批处理后的撤销或重做在 EDA 界面完成；此命令不运行 DRC。 |
| PCB 图片 | `pcb.placeImage`、`pcb.listImages`、`pcb.modifyImage` | 将 PNG 输入转成单色矢量轮廓，不保留彩色位图。读回图片对象并检查板上显示。 |
