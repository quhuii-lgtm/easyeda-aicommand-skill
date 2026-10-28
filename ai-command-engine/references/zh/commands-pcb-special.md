# PCB几何命令

## 0.20.123 混合规则与几何组合（已安装，限定实机结果）

0.20.123已安装，规则、导入及持久化通过限定验收；后续20轮功能路径已由隔离DRC确认，原夹具孤岛报告保留。支持各自SAFE／TRACK和唯一SDK双绑定均确认的NET＋NET_CLASS双方混合，显式NET线宽优先，双方混合不增加历史删除豁免。applyLayerWidthRules默认false；显式true在完整已知默认层快照、精确完整铜层映射下允许缺structure base，为每个缺失层写明确preferred，from说明未提供base；非法／重复base仍拒绝或unknown。已有class base及优先级保持，无class NET未开放。默认SAFE已有profile可兼容严格TRACK-only类结构与有效独立NORMAL焊盘端点覆盖；槽孔仍读原有Slot Region→Track单元，不开放混合SAFE间距继承。

双方混合先分别检查NET和CLASS的SAFE引用、TRACK、唯一SDK行、类归属及来源。空／default NET、parent、铜层覆盖、冲突或未消解删除仍未知。同名SAFE的真实宿主对照完成185条保存重开，线宽报告与控制一致；异名SAFE是回归证据，不能称异名实机通过。

缺base时，每个signal层必须得到明确宽度。已有相同层覆盖保持，冲突／重复／缺映射拒绝，全部预检后输出；DEFAULT比较仅在真正缺base且全层覆盖时可确认。已有非法base不能被层覆盖掩盖。CLASS仍用自身base及layer_rule。

槽孔新路径联合核对源码NET类归属、唯一NET／CLASS selector及SDK一层嵌套关系；CLASS只有TRACK，NET为空或只有TRACK，SAFE全default，parent为空且无铜层覆盖。网络端点仅由有效PAD_NET或已确认独立NORMAL PAD关联覆盖，不从NET声明、LINE、ARC推断。现有默认SAFE标签、单位及单元取值保持；OVAL轮廓和ARC几何由原流程另行核对。

原生SAFE多ticket历史、parent／铜层覆盖、真实生产资料、唯一文字来源、外部DSN重存及历史OOM／PNG复现条件保持原状态。构建或本地回放不能代替候选安装后命令、保存重开及目标DRC。


剩余来源核实（2026-10-27）：当前EDA4.1.78的两份SAFE配置共178个单元值及单位与source一致，标签由同次SDK表提供；这不证明通用SAFE优先级、对称性、parent或铜层覆盖。固定FreeRouting2.5.0无头输出路径接受DSN格式但没有生成DSN数据的分支，既有0字节／退出1观察保留，不重试参数来假装修复。可用替代是保存PCB后pcb.exportDsn重新导出；该路径已核对9864字节文件中的新增10线、2孔位置／padstack直径及分层宽，最大坐标偏差约0.001mil，不证明钻孔输出或外部DSN重存。autoRouteStart旧范围帮助文字已仅在开发源码修正，未改运行逻辑，未进入已安装123冻结包，后续统一候选再带入，不需为此额外升级。

SAFE原生行为补充（2026-10-27）：EDA4.1.78独立普通顶层异网LINE样例中，6mil铜边距在双方默认时不报间距错误；任一侧或双方绑定8.2mil时，原生DRC明确要求8.2mil。原生设置类规则会同时写入成员NET绑定；单网选回默认会删除其SAFE字段，SDK返回default，即使类仍8.2mil，目标6mil仍不报错，保存重开保持。因此不能从NET缺SAFE推导动态类继承。此结果仅约束本样例的后续实现，当前插件未新增SAFE间距合成。夹具仍有预设3mil间距及4条悬空线报告，不称整板DRC通过。

SAFE映射只适用于本次同板稳定快照：13个行标签、12个列标签，各表89个现存单元，source columnNames为空，不能仅凭索引推断其他版本。source isForAll=ALL与SDK表key1／source行layerId1同时保留，未把它解释为只作用于物理顶层。Slot Region→Track为[8][0]、11.811mil。SDK类型仍为Record<string,any>，未据此开放任意矩阵或混合SAFE继承。

宿主重导出的DSN来自已保存203条PCB，保留全部源与规则，只证明该导出快照中的几何和宽度。它不替代路由器自身DSN序列化，也不将文件存在当成连通或生产验收。外部实现若补齐原生DSN输出，需另核层宽保真；本轮没有更换JAR或引入依赖。

后续未布通定位（2026-10-27）：同一8590字节DSN保留全部旧铜、线宽、间距，受控20轮在第17轮首次0unrouted；原验收maxPasses5不足，插件默认maxPasses50保持。新独立副本以正式在线20轮取回原始SES，输入／输出CRC通过，新增10LINE／2VIA，3ARC／89保护段准确消解，原191条data保持。12个新增几何逐项独立核对正确；203个ID及新增data保存重开保持，199条data相同、4项显示默认值省略，两次重复零新增。

保留原功能几何及规则，只将3条旧LINE与1条旧ARC换到诊断网，另加2NET与2selector，207条保存重开data及ID精确保持。隔离副本中+5V、ACE_VIA功能网络、12新增对象和功能焊盘DRC报告0，仍有5项诊断旧对象报告。原网20轮副本仍有9项DRC，不能称原板或整板DRC0；旧5轮203现场保持。未发现导入丢线或网络映射缺陷，不需修改代码或升级。临时服务退出、全局配置保持，当前保留未改网的20轮203条结果页。此结论只代表该输入，不保证任意板20轮完成。

123限定实机结果（2026-10-27）：正式双方混合规则读取／转换matched，底层23／36mil两项线宽违规写前拒绝后185条零变化；合法两线后187条保存重开（183条data相同、4项显示默认值省略），全部ID及新增两线data保持，两次重复零新增。新增线TrackError0、各有预设悬空ConnectError，全板28项。

独立几何组合副本完成正式Start／Status／GetResult／原始SES显式导入；槽孔11.811mil、4项DEFAULT及8项class转换同次保留，输入8590／输出5584字节CRC及原始SES字节独立核对通过。3条ARC／89保护段准确消解，新增9线3孔，12个新增对象几何逐项核对正确。原191条data保持，全部203条data及ID保存重开保持，两次重复零新增，task0。

本样本整板连通未通过：DRC共9项，新增+5V过孔有1项ConnectError。原始SES仅含底层焊盘附近一线一孔，缺少到顶层焊盘的路径；路由器日志明确1unrouted及4项既有clearance报告。现有证据支持导入与SES一致，未确定路由未布通的进一步原因。COMPLETED表示任务结束。不得把本结果记为整板布通或生产验收通过。

首次在线任务完成后连接和临时服务变化，SES未取回；已保留中断记录。确认没有写板、原任务完成且旧进程退出后，以新编号任务完成上述流程。没有重发不明写入。临时服务已退出、全局配置和原191条工程保持。无base仍以本地转换及锁定JAR证据为准，未宣称宿主原生导出无base。其他既定客观限制保持。

## 0.20.122 默认层规则、SAFE历史与网络类组合（限定实机验收通过）

122已完成限定实机验收。本版不新增调用参数，applyLayerWidthRules默认false保持；显式true同时处理已确认DEFAULT层preferred与网络class层宽。

### DEFAULT层规则

保留结构全局width原文，在signal layer内部补(rule(width N))；不同于class的layer_rule。default-layer-width逐项带layer、from、to与行号，class变更仍kind:layer-width。已存在相同覆盖保持，冲突／重复／未知结构或映射不完整时整体拒绝，不输出部分转换。只表达preferred，不把min／max变成DSN约束。

DEFAULT比较按层内width优先、否则全局base；NET按class layer_rule优先、否则class base，DEFAULT不覆盖显式class。先逐层求值，仅当EDA bounds及实际DSN各层width均相同才合并scalar。无覆盖的旧scalar比较保持。无class网络仍不属于插件转换范围，JAR隐式默认网络只作为优先级证据。

开启转换要求唯一、简单、正的结构全局base width。缺base是本候选明确不支持的输入，不能称它为非法DSN；此前class-only能接受的这种形态现在会拒绝。新增默认层rule限仅width，非signal层规则及structure直接layer_rule仍拒绝；原class层width加合法clearance兼容保持。

### SAFE历史

仅对明确引用的SAFE，同一原始字符串ID、全部有限正安全整数ticket且无任何重复时选唯一最大ticket，顺序无关。只核最新实体profile，最新删除或坏实体不回退。不同原始ID即使JSON语义同名仍未知。合法重建仅消解当前混合NET引用的该SAFE旧删除；其他来源歧义和删除继续阻断，原全局诊断保留。历史分支以真实实体派生日志回放验证，未取得宿主原生历史更新日志，不称原生历史实机通过。

### NET_CLASS组合

已由typed导入的构造配对经宿主实际保留、SDK类自身双绑定、DRC及保存重开核实。仅严格NET_CLASS SAFE+TRACK、类自身Safe Spacing／Track一致且NET明确TRACK-only绑定时确认TRACK，显式NET优先保持；不要求NET Safe Spacing等于类值。空NET类继承、双方同时混合、CLASS删除重建豁免和SAFE间距语义均不在新增范围。parent、铜层覆盖仍缺可靠输入。

三份真实保存输入回放，各4项DEFAULT与2项class转换、网络及默认比较matched，非目标原文保持且幂等。实际生成DSN离线JAR输出9线4孔，路径宽度匹配；旧线只从离线输入去除，EDA未因此改图。槽孔／DEFAULT／class同一提交组合回归通过。122正式profile在NET_CLASS混合样本中确认两个显式NET的逐层范围。DSN默认关闭仍报告差异；开启后4项DEFAULT层rule及2项class层覆盖逐项披露，默认和两个网络均matched，移除六处披露插入片段后与默认导出逐字一致，原183条保持。23／36mil写前拒绝后183条data及ID零变化；合法ACE_VIA顶20／底30各新增一线，无孔，原183条保持。保存前及重开后重复零新增，185条data及全部ID保持，规则读取保持，task0。新增两线各有刻意悬空ConnectError，TrackError0；全板26项（原7TrackError保持、19ConnectError），不称整板通过。原生历史、parent／铜层覆盖、DSN重存及生产限制保持，不把常规安装验收记为历史日志分支已实机通过。
### 122在线完整流程补充

后续在线补充：122在独立无旧线副本完成真实在线Start／Status／GetResult／显式原始SES导入，新增9线4孔，全部几何独立核对正确。两次重复零新增，183个ID及新增13对象data保存重开保持（179条data相同、4项显示默认值省略）；即时及重开DRC均0。原185条工程保持，task0，临时服务退出且全局配置保持。只代表该样本，前述混合夹具26项及其他待条件限制保留。

正式提交的2144字节DSN大小与独立CRC32均和服务记录一致；取回1708字节SES与服务output完全一致，独立CRC32核对通过。+5V顶／内层30、底15mil，ACE_VIA顶／内层20、底30mil。孔径12mil为调用方对本测试的明确输入，外径24mil，不是SES自带钻孔或生产默认。接口没有未布通计数，未补成0；服务日志明确报告0未布通和0违规。设置提交不代表全部子阶段读回确认。


## 0.20.121 NET SAFE与TRACK组合（限定实机验收通过）

当前121已完成限定实机验收。本次只补已验证形态的NET混合selector，保持原TRACK-only与NET_CLASS路径。调用参数不变，插件内部核对，不要求调用方提交规则证据。

仅EDA4.1.78、精确NET目标、parent:null、ruleOrder:4及空铜层覆盖时，ruleKeyValue恰好含非空SAFE与TRACK引用。SAFE须唯一、NORMAL、mil、ALL，并符合本次原生保存的单行结构；SDK同一唯一NET的Safe Spacing及Track须分别与两个引用一致。规则名和正数内容不硬编码。同名SAFE若在源码日志中有多条历史记录，本候选仍保持未知；不把引用结构确认当作SAFE间距已验收。既有来源唯一性、删除歧义、类归属及完整分层检查保留。其他版本、额外字段、复杂parent／覆盖、异常SAFE结构或绑定冲突继续unknown。NET_CLASS混合selector不在范围内。

SAFE在这里仅作为引用及结构一致性证据，不解释间距矩阵语义，也不放宽槽孔SAFE补偿条件。已确认TRACK可供SES范围检查、DSN逐层比较及显式applyLayerWidthRules使用；确定违规仍拒绝，其他未知仍保留。

两份原生配对工程各183条，仅NET selector的SAFE键不同。SDK Track均ACE_POWER20；Bottom23／36mil均报25–35，Top20／40合法，Bottom27合法。保存重开后七条TrackError的对象、规则名和范围一致；DSN width20相同，clearance7.99／4.02不同。全板各24项错误不记整板通过。后续121正式profile已确认ACE_VIA四层范围；显式DSN转换分别将+5V底层30改15、ACE_VIA底层20改30mil，两个网络逐层比较matched。23／36mil SES写前拒绝后183条data及ID零变化；合法ACE_VIA顶层20／底层30各新增一线，无孔。保存前及重开后重复零新增，185条data及全部ID保持，规则读取保持，task0。新增两线TrackError为0，各有刻意悬空ConnectError；全板26项（原7TrackError保持、19ConnectError），不称整板通过。此夹具DSN结构默认15.05mil与逐层默认5／15／100及22／27／38仍不匹配，底／内层低于最小22mil；routingConstraintsComplete:false。网络逐层匹配不代表默认结构约束完整或生产通过。

## 0.20.120 B4厚度、CLASS／DEFAULT分层与显式DSN转换

120已在EDA4.1.78完成限定实机验收。正式厚度字段与保存重开保持通过；混合违规与未知共同返回并写前拒绝，181条data及ID零变化。合法顶层30／底层15mil新增两条LINE，无VIA；保存前及重开后重复导入零新增，183条data及全部ID保持，task0。新增线TrackError为0，各有刻意悬空的ConnectError。全板22项（5项TrackError、17项ConnectError），不称整板通过。

原178条规则工程只读保持。正式DSN默认底层20，显式开启后仅补+5V底层30mil层覆盖，四层网络比较匹配，转换逐项披露。结构默认27.05与EDA27mil仍为mismatch，routingConstraintsComplete:false。后续独立无旧线样本已完成120在线完整往返。实际服务输入与正式导出的2029字节DSN大小及独立CRC32相同；取回1560字节原始SES与服务输出完全一致。原文件新增7线4孔，+5V顶／内层20、底层30mil，ACE_VIA为27mil。24mil过孔外径及调用方明确给定的12mil测试孔径核对正确，不作为生产默认。保存前及重开后重复零新增；181个ID与新增11对象data保持，177条data相同、4项显示配置省略display:true；即时及重开DRC均0。原183条工程保持，任务0，临时服务退出且全局配置保持。此结果限该样本，不覆盖前述混合夹具22项。下述原生取证、离线路由和制造限制各自保留。

### 厚度证据

physicalLayerEvidence保留thicknessRaw，新增thicknessValueStatus（valid-nonnegative／invalid）及可选thicknessMm。仅editorVersion严格等于4.1.78时，thicknessUnitStatus为observed-mil-eda-4.1.78；有限非负number按0.0254换算mm，其他版本或无效值不生成mm。unitEvidence明确来自原生界面、源码及保存重开观察，不声明固定量化算法或误差界限。零值不证明材料资格，不按SUBSTRATE use:false过滤介质。

FR4原始59.449→47.244对应界面1.51→1.2mm；顶铜1.379→2.756对应0.035→0.07mm。换算结果保留原始量化差异，不round回界面值。重复zIndex仍未知；唯一数值顺序只表示源码顺序，不代表板厂层映射、名义／成品板厚、阻抗或订单已匹配。制造比较相关项仍可为unknown，附件已知单位不等于制造通过。

### 规则与混合反例

新增4.1.78／mil／open的严格DEFAULT多行，及简单CLASS所指NORMAL多行规则的绑定确认；行ID唯一且完整覆盖SDK启用SIGNAL集合，各行范围合法。NET、CLASS、成员和SDK Track继续唯一一致。显式NET选不同规则时保持NET优先；NET与CLASS明确同名绑定时按该表逐层取值。严格空NET selector且SDK default时取DEFAULT，不改成自动继承CLASS。非空parent、copperValue／innerPlaneValue、SAFE+TRACK等复杂selector继续未知。已知违规与未知同时出现时仍返回violation并保留unknowns。DEFAULT范围不同时，widthRuleComparison.defaultRule也可返回layers逐层比较，不以首层代表全局。

### 显式DSN分层宽度

调用示例：`{cmd:"pcb.exportDsn",params:{applyLayerWidthRules:true}}`。autoRouteStart可传同名开关。缺省或false保持现有导出行为；非法类型在SDK／服务调用前拒绝。插件内部读取并核对来源、焦点、规则与层映射，不要求调用方填写这些证据。

开启后只处理已验证4.1.78、source mil及DSN resolution mil1000。全部预检通过后，在唯一单网络class中补入与base width不同的已知正数preferred；不重写base width，不拆多网class，不修改EDA规则或SES。保留非目标原文，conversion.changes以kind:layer-width附net／className／layerId／layerName／fromWidthMil／toWidthMil及行号。已有相同覆盖保持，重复应用不叠加；未知规则、成员不明、层映射缺失／重复、覆盖冲突或源码变化明确拒绝，自动布线在提交前停止。

比较器认识已验证class layer_rule；按指定层覆盖，否则回到class base width。存在覆盖时须唯一精确层映射；net-scoped和结构层覆盖仍未知。没有覆盖的纯scalar比较保持兼容。最终base64／size、比较、routeBaseline和实际提交使用同一文本；既有plane／slot转换及诊断保留。routingConstraintsComplete仍为false，不表示DSN已表达全部设计约束。

真实原生DSN两例分别补1项和4项，非目标原文逐字节保持、幂等通过。候选生成的真实导出派生离线输入在FreeRouting2.5.0输出7线4孔，+5V顶／内层20、底层30mil，ACE_VIA各层27mil；这是路径宽度证据，不是整板生产通过。官方2.5.0支持class层规则，net内同样声明会被忽略，不能互换作用域。

## 0.20.119 显式NET分层TRACK限定实机验收通过

119已在EDA4.1.78的ACE_RULE_LAYER_INPUT_20261026独立工程完成本批一次导入验收。初始176条与118保存结果一致。正式DSN返回+5V四层对照：顶层及两内层5／20／100mil，DSN20匹配；底层25／30／35mil，DSN20相对默认30偏差-10且withinEdaBounds:false。保存重开后结果保持，routingConstraintsComplete仍为false。

受控SES含顶层20及底层20／40，命令51ms写前拒绝两项底层违规；独立读回确认176条data和ID零变化。随后合法顶层20、底层30各新增一条LINE，无VIA，坐标、层、宽度及网络逐项核对正确，原176条保持。保存前和关闭重开后重复导入均alreadyPresent:true、imported:false、sesGeometryVerified:true，零新增。重开178条data及全部ID保持，task0。

一次重开DRC中新增两线TrackError为0。全板16项，原14项逐项保持；两条刻意悬空线各1项ConnectError。本次验收证明分层线宽，不证明测试线端点连通或整板通过。非空parent／复杂铜厚继承、DEFAULT／CLASS多行、其他未验证版本或单位继续未知。制造参数分层映射仍只有合成计算输入回归；真实厚度、计算与订单证明未补齐。原生DSN底层规则表达缺口及历史无响应原因保持。

# PCB几何专题命令

## 0.20.119 安装前候选记录（实机结果见上节）

新增已观察到的EDA4.1.78、NORMAL、mil、track.isOpen:true简单显式NET多行规则。每行仅有layerId／stroMin／stroDef／stroMax，层ID为唯一整数，宽度为有限合法范围；行集合精确对应SDK已确认启用的SIGNAL层，按ID映射而不按行序。source唯一性、NET／CLASS selector、SDK网络归属和绑定继续核对；不完整或矛盾时保持unknown。原单行路径保留，DEFAULT／CLASS多行、其他单位／版本、非空parent／copperValue／innerPlaneValue及复杂DSN层覆盖仍未确认。

pcb.exportDsn及pcb.autoRouteStart共用逐层对照。若网络各层min／preferred／max不同，nets中该网新增可选layers，每项为layerId、name、status、eda、dsnWidthMil、deviationFromPreferredMil及withinEdaBounds。网络聚合项不放单一eda／偏差／范围判断，任一层mismatch即网络mismatch；各层范围相同则保持旧结构。源码／焦点不稳定时逐层确定值一起降为unknown。该对照只报告，不修改DSN，routingConstraintsComplete仍为false。

真实UI生成的ACE_POWER20四行：Top／Inner1／Inner2为5／20／100mil，Bottom为25／30／35mil。当前原生DSN仅class +5V width20，未携带底层preferred30；候选回放明确报告底层偏差-10mil且20不在25–35范围，其余层matched。原生DSN表达缺口不等于本候选已实现层规则写入。

pcb.importAutoRouteSes复用按layer选择范围；候选回放中底层20／40违规，底层30及顶层20／40合规；同批确定违规和unknown并存时仍写前拒绝。制造参数核对继续按edaLayerId消费规则；相关上下层测试为合成已验证状态输入，不构成真实阻抗计算或订单证明。

16组相关回归、真实保存重开样本离线回放、类型检查及专家具体差异复审通过。原生宿主首轮／重开DRC已确认顶层20／40无TrackError、底层20／40触发25–35，176条data及ID保持；这是118配合界面规则的证据，119尚未安装。底层30的宿主合法SES写入、候选逐层DSN正式返回、违规零写及保存重开待统一验收。

## 0.20.118 显式NET与NET_CLASS不同绑定的补充实机证据

EDA4.1.78，实例a4b1b920，独立工程ACE_RULE_NET20_CLASS30_20261026，UUID7c1c5a330d8a4c12a992c6a31c32e3e3。仅将+5V NET selector的TRACK从ACE_CLASS30改为既有ACE_POWER20；所属ACE_TEST_CLASS仍选ACE_CLASS30，其他173条data及四条20／40mil探针保持。导入后source和SDK明确保留NET=20、CLASS=30两个不同绑定，DSN的+5V输出20mil。

首轮及保存关闭重开后，+5V的20／40mil探针均无TrackError；同次ACE_VIA的20／40mil探针各触发DEFAULT 22–38mil错误。两次全板均10项，不称整板通过。保存重开后174条及全部ID保持，170条data相同，4项显示配置省略true单列，规则及探针保持、task0。默认DSN27.05mil与首选27mil的既有差异继续报告，未静默修整。

这只补齐已支持的简单显式冲突场景的宿主DRC证据，不构成通用继承解释器。非空parent、非空copperValue／innerPlaneValue、多行／分层规则仍需真实合法样本和有区分意义的宿主对照；不凭字段名猜结构。5／100mil边界及交互默认落线宽度未由本组探针验证。未修改运行源码、未重建118冻结包。证据入口：工作区rules-20261026/evidence/net20-conflict-acceptance.json。

## 0.20.118 限定实机验收（正常导入、幂等、持久化及隔离目标连通通过）

EDA4.1.78实例a4b1b920，正常导入工程ACE_STABILITY_ROUTE50_V118_20261026，UUID387ee67182b940d39252a100a0ffb5d4。190条副本导出的DSN与原保存输入逐字节相同。原样完整50轮SES正常返回imported:true、sesGeometryVerified:true，12条新LINE及2个新VIA逐项独立匹配，原190条data保持，3ARC／89段保护链关联。首次导入5224ms，保存前及重开后重复导入分别4238ms、4297ms，均alreadyPresent:true、imported:false并零新增。保存53ms、关闭1728ms、重开3508ms；重开204条及全部ID保持，200条data一致，仅4项PRIMITIVE显示配置省略true。最终source保持，task0。此副本没有运行DRC。

隔离工程ACE_V118_PLUS5_ISOLATED_20261026，UUIDd8db52709feb4a598e887146d6271807，基于117已核对的完整路由，仅将两条旧LINE和一条旧ARC由+5V移到ACE_ISOLATED_OLD_COPPER。目标两PAD／两LINE／一VIA、原+5V网络和全部原规则保持。增加一个NET及宿主生成的一个精确空RULE_SELECTOR，实际206条。新增selector只绑定隔离测试网，ruleOrder:4、ruleKeyValue/copperValue/innerPlaneValue为空、parent:null；仅此精确记录单列，不推广为所有空selector可忽略，也不证明复杂继承已验收。

SDK读回确认+5V恰为两个PAD、两条LINE和一个VIA，三个旧铜对象恰归隔离网络。保存62ms、关闭1127ms、重开4150ms；206条和全部ID保持，4项显示默认字段省略单列。唯一一次DRC1764ms，目标+5V及五目标对象违规和连接项均为0；全板8项为5旧Physical Error和3隔离旧网连接项，passed:false。DRC后source保持、task0。该对照支持本样例前次报告受旧同网铜岛影响，不扩大为所有SES或整板／实物电气验收。

证据入口为工作区stability-20261026/evidence/v118-route-acceptance.json及v118-isolation-acceptance.json。116／117／118冻结包保持，未重新打包、未发布。历史renderer OOM与图形资源异常的触发原因仍未知，本次正常执行不记为根因修复。

## 0.20.118 安装前候选记录（实机结果见上节）

本次只补直接追加路径的新增LINE身份变化。每次已有getAllPrimitiveId枚举与原before LINE／TRACK、当前已确认新LINE及本次candidate集合比较。候选消失、已确认新线消失或出现未登记ID，均先使用原焦点与总预算读取并核对完整已写前缀。原对象ID、几何及有效源data、新VIA已确认ID、线段覆盖／重数和属性继续严格核对。通过后才替换当前新增线ID集合，原始candidate及身份变化事实保留在journal。最终已有fresh snapshot也做同一核对，再按当前ID查源记录。正常路径不增加全量snapshot；native和replace不扩大放行。参数和SES原文不变，不重试、不自动保存重开。

14组相关回归通过，新增11个T接拆分情形。真实序列回放覆盖第6条合并、第7条candidate仍在但先前新线拆分：冻结116在第6条停止，冻结117在12条写完后因旧ID失败，118源码完成12线2孔且原190条data保持。此为离线回放，不能代替宿主成功回执。

## 0.20.117 部分实机验收（完整路由及持久化确认，命令回执失败）

EDA4.1.78独立工程ACE_STABILITY_ROUTE50_V117_20261026，实例91d03f89。新DSN与原保存输入逐字节相同，原样50轮SES发送12次LINE及2次VIA创建并全部返回。第6条共线合并已确认；随后T接点将该水平线拆成两个新ID，而第7条candidate仍存在，旧账本未更新。最终几何核对已通过，源ID查找误报失败；返回partial:true、restored:false、retryable:false，补偿因未确认替代ID而跳过，未删除或恢复源码。

主代理独立核对204条source与诊断SDK全部LINE／VIA／ARC、完整计划12线2孔、原190条data保持、无恢复写入及task0后，在已授权范围继续保存关闭重开。保存64ms、关闭1482ms、重开4333ms；204条和全部ID保持，200条data相同，仅4项PRIMITIVE显示配置省略true。一次DRC2066ms正常返回10项：5旧对象Physical Error和5项+5V连接报告，新增对象中+5V VIA为1项；本次没有ACE_VIA连接项或PN项。DRC后源码204条保持、task0。

这些证据不能把117的命令成功回执或目标连通记为通过。+5V旧铜岛与目标线路处在同网，当前报告不能区分局部跨层异常和相对其他同网铜岛未连通；后续采用独立净网隔离对照，不反复DRC或放宽规则。118候选尚未安装。此次保存重开与DRC正常返回，不证明历史OOM根因已修复。

## 0.20.117 新增走线合并适配候选（尚未安装验收）

`pcb.importAutoRouteSes` 保留调用方SES。新建LINE返回ID未出现在完整枚举时，在原焦点和总预算内读取完整结果，核对截至该步已返回的全部LINE／VIA前缀、线段覆盖和重数，以及原有LINE／VIA／ARC身份、几何和有效源码。只有本批新增线的等价替代通过，才更新当前确认的新增LINE ID；新VIA的已确认ID及孔径继续严格保持。原始创建候选和合并读回事实保留在既有journal中。恢复只使用当前已确认的新增线及逐个确认的过孔，不凭失效候选或未知替代ID删除。参数、SES内容、时间预算和自动保存行为不变。

116独立副本已复现两条新共线线段合并后换ID，命令在第6条线停止；原190条data保持，现场新增5LINE／2VIA，197条，未保存重开或运行DRC。117源码的相关回归及真实几何回放已通过，冻结116在相同回放中仍于第6条停止。回放修复版完成12次LINE／2次VIA创建，两个输入段变成一条实际线，故实际新增LINE为11；宿主实机的最终图元数须按实际合并结果核对，不能固定断言204条。

本候选尚未安装，不称实机导入、保存重开或连通DRC通过。此前渲染进程OOM和图形资源异常的具体触发原因仍未知；本适配不解决该稳定性问题。

## 0.20.116限定实机验收（重复导入及保存重开通过）

用户明确同意追加导入并只验重复导入和数据保持。EDA 4.1.78实例29a21521、独立工程ACE_B5_OVAL_ARC_BOTTOM_20261026中，保存前和保存关闭重开后分别使用115取回的原始SES及原始routeBaseline导入，均返回alreadyPresent:true、imported:false、sesGeometryVerified:true，3条ARC/89段关联保持。两次新增LINE和VIA均为0，202条记录及所有data保持，导出对象未改，任务为0。两次导入耗时4556ms、4660ms；保存51ms，关闭1743ms，重开4242ms。

本轮不运行DRC、不打开旧原PCB。115即时全板12项（其中新增过孔1项未连接）、服务仍1条未布通/4项警告、重开DRC和打开旧PCB分别300秒超时继续作为历史未解决项。本次限定操作均正常返回，不能据此确认历史白屏原因已解决。证据保存在工作区b5-oval-arc-20261026/evidence/v116-live-acceptance.json及v116-repeat-before-save.json、v116-repeat-after-reopen.json、v116-final-source.json中。

## 0.20.116安装前候选记录（实机结果见上节）

0.20.115首次导入后，三个有效ARC的`ticket`由171/172/173变为174/175/176；导入后、保存、重开和用户重启四种来源中，`type`、`id`和全部data均保持。保存、重开和重启后的`ticket`均保持174/175/176。0.20.115重复导入因此误拒绝，且拒绝后源码未变。0.20.116仅在有效ARC比较中忽略`ticket`；两条入口使用同一归一化逻辑，其他header字段和全部data继续严格比较，`routeBaseline`结构不变。

14项相关回归、独立真实数据回放、专家复审、TypeScript检查和构建已通过。独立回放使用实际安装0.20.115的导入后、保存、重开和用户重启四种状态；每种状态均对应3条ARC、89个保护段，重复差集为0/0，9类ARC身份或数据变化输入均被拒绝。回放未安装0.20.116，不构成该版本实机验收。包信息待主代理补录；0.20.116尚未安装，是否额外再导入尚未获得同意。当前新连接`afd9fc17`停在开始页，未打开PCB或DRC，等待范围评估。

## 0.20.115限定实机验收（首次组合导入成功，重复导入未通过）

### 首次导入和保存重开

在EDA 4.1.78中完成首次同源DSN/SES组合导入。3条既有ARC对应89个保护段均匹配成功；本次写入9条LINE和3个VIA，原有对象保持，SES几何对应核验通过。首次导入和保存重开后的源数据均为202条有效设计记录，重开时未发现data表示变化。

即时全板DRC为12项；新增对象中有1项连接错误，定位到未连接的`+5V`过孔，PN分支对象为0。该结果不代表全板通过。布线服务返回`COMPLETED`，但仍报告1项未布通和4项警告，不据此认定全部布通或DRC通过。

### 重复导入失败与重开读回

同一组合SES再次导入时，0.20.115在写入前拒绝：三个ARC的header.ticket由171/172/173变为174/175/176，但type、id和全部data相同。拒绝后源数据未变化，因此没有重复写入。该误拒绝属于插件候选的比较缺陷，已由0.20.116候选调整匹配规则。

保存重开后的DRC查询等待300秒超时；没有可用结果，不能将它记录为0。用户说明EDA窗口无响应后自行重开。主代理在新连接`31d3482d`只读取得202条数据，`task.list`返回0。之后对原工程的`project.open`和`getInfo`成功，但打开原PCB等待300秒超时；原工程190条数据尚无最终读回。界面观察为原工程标题、白屏工作区，之后已停止实时操作。

实机证据保存在工作区`b5-oval-arc-20261026/evidence/`：`v115-first-import-persistence-audit.json`、`v115-repeat-difference.json`、`v115-combo-import.json`、`v115-combo-repeat.json`、`v115-reopened-drc.json`、`v115-user-restarted-source.json`、`v115-restart-tasks.json`和最终现场审计`v115-user-restart-audit.json`。

本页只在扇出、局部铜皮、焊盘外扩或网络丝印任务中读取。命令名见[PCB低频指令](commands-pcb-low.md)；参数、默认值和返回字段查已核对所选窗口版本的 `/help?cmd=<命令名>`。

扇出允许合法的零线宽实填充，仍将其多边形作为铜面障碍。若实填充路径与父边框坐标不符，计划保持不可执行，并说明坐标尺度尚未核实；不要自行乘除10或忽略铜面。原生R矩形按左上角向下展开；未核实的R旋转、圆角不作直角矩形近似。

## 共同流程

1. 激活目标 PCB，读取当前器件、焊盘或过孔 ID；位号不能代替图元 ID。
2. 运行对应的只读计划命令。检查 `executable`、目标、网络、层、几何、`coverage` 和 `warnings`。不可执行或覆盖不完整时，不提交写入。
3. 将规划响应的**完整 `data`**原样放入执行命令的 `params.plan`。不要自行重组或删减计划字段。
4. 插件逐项写入和读回。部分失败时保留已创建对象，先查现场，不重放旧计划。命令不会自动完成板级 DRC、保存或制造验收。
5. 运行适用检查并保存；需要持久性证据时关闭重开后再核对。

铜区操作使用共享 SDK 总时限。超时不表示已取消已发出的调用；结果未明确前不启动依赖写入，也不重放计划。

| 任务 | 计划 → 执行 | 必须另外确认 |
| --- | --- | --- |
| 密脚焊盘扇出 | `pcb.getFanoutPlan` → `pcb.fanout` | 只完成焊盘到出口通孔，后续网络仍须布线。 |
| 局部铜皮 | `pcb.getAutoCopperPlan` → `pcb.autoCopper` | 区分边框覆铜 `pour` 与固定铜 `fill`，确认实际填充。 |
| 焊盘外扩 | `pcb.getPadExpansionPlan` → `pcb.expandPads` | 生成禁铺铜、禁填充或阻焊区域，不改变焊盘铜尺寸。 |
| 网络文字丝印 | `pcb.getNetSilkscreenPlan` → `pcb.generateNetSilkscreen` | 文字可读、不压焊盘；底层检查镜像。 |

## 扇出范围

目标按器件、焊盘或网络选择，ID 必须来自当前 PCB。线宽、过孔铜外径、钻孔、引出长度和间距按当前设计给定，单位 mil；钻孔小于铜外径。多层或通孔焊盘明确选择顶层或底层，当前实现创建通孔，不能称盲孔或埋孔。板框、障碍、焊盘形状或规则无法安全解析时，计划不可执行。扇出不证明全网连通、DRC 或制造合格。

v0.20.59 安装版样例中，bottom 层 R2.2 的 +5V 焊盘计划返回 `coverage.complete:true`、`executable:true`；执行成功创建 2 条线和 1 个过孔。保存、关闭、重开后 ID、网络、层和 8 mil 线宽，以及过孔 24/12 尺寸保持；坐标仅有小于 0.001 的浮点舍入。两个已接线 ACE 目标无可行路线，不作为该填充读回样例失败。

## 局部铜皮和实填充

`pour` 会受覆铜规则裁剪，可能只剩边框或零填充；`fill` 是固定导电形状。两种模式不能自动互换。计划按网络和铜层分组，不把不同网络合成同一铜片。当前板框只接受已核实的单一闭环；曲线、多环或缺少完整障碍信息时，不把部分计划当安全几何。

新建或重建覆铜后可用 `pcb.getPourFillReadback` 只读核对关联填充、父边框、网络和层。填充路径非空不证明几何正确或满足制造要求。读回失败或未知时停止依赖写入；旧命令的部分失败不能改称成功。

新建覆铜可指定 `net`；`modifyPour` 暂不用于改已有覆铜的网络或名称。EDA 界面手动操作仍可用；操作后核对覆铜顺序、执行重建并读回实际填充。不要建议 AI 自动删除再创建覆铜作为无损改网或改名方案。

v0.20.40 `pourCopper` 单 R 路径候选只接受一维路径或恰好一层包装，并核对 7 项完全相等；多环、额外嵌套或参数变化拒绝。raw 与 normalized 输入用于诊断。候选统一回归和新版宿主验证待完成。

0.20.22 起 `pcb.autoCopper(pour)` 即使重建调用返回空，也会独立读回实际填充；只有父边框、网络、层、边界与有效填充全部核对通过才报告成功。若仍无填充，返回不可重试的部分写入并保留已建边框 ID，先核对现场，不自动再重建或删除。此版尚未取得宿主生成实填充的正向验收。

0.20.23 起重建返回对象的 ID 仅作诊断，不能据此认为它是本次新建填充；`createdIds` 应只列确认新建的边框。清理前仍须用图纸源码和关联 ID 核对目标，不能直接按重建返回 ID 删除。2026-10-18 的隔离宿主测试确认旧底层 ID 未进入 `createdIds`；新顶层边框仍没有实填充，自动覆铜功能尚未通过。

0.20.24 起，计划若因异网障碍把目标外扩降为零，会在警告中给出首个触发障碍及净距规则。仅当正外扩的单个标准矩形焊盘 `pour` 计划最终轮廓能严格证明等于焊盘本体时，计划判为不可执行；复杂或无法证明的形状只提示不确定。`executable=true` 仅表示计划检查允许执行，不保证宿主产生填充。不要靠调大 `expansion` 推断边界变大，应核对 `plannedPrimitives` 实际轮廓与 `warnings`。

v0.20.43 在既有标准单矩形 gate 中补识别 `Pad` / `ComponentPad`，不改 gate 条件。有限 `Number` 用十进制 `String` 建局部 `BigInt` 有理数模型，精确比较中心 ± 半尺寸所得四角及闭合边，允许换起点或反向；不改全局几何比较，不容差、不取整、不吞微小外扩。无法支持或严格比较不一致时结果保持不确定。该方法不能恢复宿主内部精度，也不保证修复全部无填充问题；候选本地与宿主验证待完成。不接触焊盘的小框四岛仍单独判断。

v0.20.39 `autoCopper` 连接规则候选保留原始来源和选择状态。选择未知、或 `fill` 模式下覆盖不适用时，只作为诊断信息；不保证生成填充。此候选不改变 `autoCopper` 默认值 `false`、固定铜区域或执行语义，尚待本地最终核查和宿主验收。

- v0.20.46 候选保留来源中的 `thermalGap.raw` 与 `sourcePath`，但单位保持 `unknown`。`unitLabel` 独立记录，不用于推断 mm 或 mil。覆铜规则 `selection` 仍是 `unknown`。
- `pcb.getComponentPads` 逐焊盘增加 `heatWelding` 只读诊断，状态区分 `null`、`config`、`unavailable`、`exception` 和 `invalid`。getter 明确返回 `null` 才记为 `null`。
- 读取异常返回 `{status:"exception",error:{message}}`；无效返回值返回 `{status:"invalid",returnedType,reason}`。getter 不可用时返回 `{status:"unavailable"}`。
- `config.value` 只列 `connectionMethod`、`divergenceSpacing`、`divergenceLineWidth`、`divergenceAngle`。缺失的可选字段不补零。读到配置不证明覆盖优先级或宿主实际采用的规则。
- 没有新增命令参数或写入行为。本地与宿主验证待完成，不表示四岛几何已修复。

## 焊盘外扩和网络丝印

焊盘外扩的模式为禁止铺铜、禁止固定填充或阻焊外扩，均不增加导电铜。计划仅支持明确覆盖的焊盘形状；曲线为近似结果，实际阻焊开窗仍须核对生产输出。计划中的完整轮廓和分片不能删减。

网络丝印是可编辑文字，不建立电气连接。核对目标焊盘网名、文字层、旋转和底层镜像；执行后还要检查与焊盘、板框和其他文字的视觉间距。


---

# DFM与SMT检查

# 嘉立创下单检查（PCB DFM）

> 本页说明 `pcb.runDfm`、`pcb.runSmtDfm`、`pcb.checkSameNetPadSpacing` 及 PCB 菜单“嘉立创下单检查”。
> 命令经现有 `/command` 通道执行。
> 请求外层仍须带 `instanceId`。

## 1. 确认工艺输入与图纸对照

`pcb.runDfm` 以本次输入的铜厚选档检查支持性：第 5 项检查所选外层铜厚，第 6 项检查所选内层铜厚。

第 12/13 项根据设计铜层及设计层数，分别使用外层或内层所选铜厚从原工艺表取阈值。

工艺表数值和几何算法不变。

其他检查中的有效铜层数量仍按原有含铜图元启发式判断。

PCB 结果另含 `reportedCopper`，与 DFM 判定分开：`status` 为 `available`、`partial` 或 `unavailable`。

`layers` 保留原始厚度与来源；字段及单位状态见本页“图纸厚度原值与下单铜重”。

当前 `matchesTarget` 为 `null`，不从未确认单位的原值判断铜重命中。

当前 `differences` 为空，不生成未经验证的铜重差异。

`messages` 为铜厚源采集诊断字符串数组。

请求铜厚仍列在 `inputs`。

检查标准值反映本次外/内铜厚输入及对应阈值。

最新 Slot Region 槽孔检查按行列读取：第 8 行是 Slot Region，Track 第 0 列为 `0.2999994 mm`（11.811 mil）。旧表中第 11 行是 BoardOutline，不要沿用旧行号。副本中只把该 scalar 改为 25，保存重开后 DRC 值仍为 25，但 fill-slot 值仍为 10。最新 schema 的 unit flag 差异仅作参考，不自动换算。

v0.20.60 本地候选的 DSN 导出补偿仅在 source 与 effective API 均确认精确默认规则时尝试：每个目标网须唯一匹配 `getNetRules` 的 `type:net`、`name` 和 `Safe Spacing:default`；规则状态为 0，唯一规则表状态为 1，Slot Region 与 Track 标签唯一。几何仅覆盖四铜层、未联网的 FILL12 单 R、零旋转且无圆角槽孔，并要求 DSN pin 精确且独占匹配。无法确认任一条件时保留原文件并返回 warning。补偿可能使部分过孔或焊盘检查更严格；不表示完整规则等价，`planeSlotEquivalent:false`、`routingConstraintsComplete:false`。个性化规则及平面与槽孔规则等价性仍未验证；该候选待安装版验收。

图纸铜厚与本次输入不一致、缺少 `LAYER_PHYS` 记录或无法解析时，只在 `reportedCopper` 表示，不单独加入 `issues`，也不因此把 DFM 判为失败。

若源读取异常影响必要几何、身份或 API 数据，则仍须按既有规则进入 `issues` 并令检查不完整。

不能被铜厚旁证豁免。

历史0.10.91报告曾把源厚度换算为1oz；当前已撤销未经单位验证的换算，该旧数值不作订单依据。

差异本身也不构成 DFM 失败。

## 2. 运行适用检查

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.runDfm` | 执行PCB工艺检查。 | 材料、板厚和铜厚确定后。 | 只覆盖返回的18项检查。 |
| `pcb.runSmtDfm` | 执行SMT贴装检查。 | 选定贴装工艺后。 | 只覆盖返回的7项检查。 |
| `pcb.checkSameNetPadSpacing` | 检查同网焊盘间距。 | 核对同网工艺间距时。 | 只覆盖该项间距检查。 |

- material接受`FR4`、`HDI板`、`高频板`、`铝基板`或`铜基板`。
- thickness使用mm，必须为有限正数。
- outerCopperOz必须是数字1或2。
- innerCopperOz必须是数字1。
- 铜厚由用户按本次下单要求明确给出。
- 不从图纸读数或默认值代填请求铜厚。
- standard接受`economy`或`standard`。
- minSpacingMm使用mm，必须为有限正数。
板材枚举以复用的上游 core 导出 `JLC_SUPPORTED_MATERIALS` 为准。

检查实现复用[上游项目](https://github.com/easyeda/eext-jlc-order-dfm-checker) v1.0.4，来源提交 `afd538786d510f537ad4fa47c6329e6a99dc7625`，许可证 Apache-2.0。

没有新增依赖。

工艺参数表及几何算法来自该上游版本，不表示与嘉立创网站当前工艺实时同步。

上游 v1.0.4 原接口只有板材与板厚。

`outerCopperOz`、`innerCopperOz` 是本地增强字段。

本次仅支持外层 1/2 oz、内层 1 oz，不代表厂家全部工艺选项。

`pcb.runSmtDfm` 与 `pcb.checkSameNetPadSpacing` 不增加铜厚输入。

菜单中的 PCB DFM 表单由用户明确选择外层 1 或 2 oz、内层 1 oz。

这些选项仅适用于 PCB DFM。

使用前须确认已安装 0.10.92 或后续含此增强的版本，并在在线命令帮助中看到这两个铜厚参数。

旧版 0.10.91 不支持它们，可能忽略额外字段。

仅向旧版请求添加参数不能证明已按本次铜厚检查。

新报告必须回显 `inputs.outerCopperOz`、`inputs.innerCopperOz` 及 `reportedCopper`。

## 3. 判断结果与完整性

命令成功回包的 `data` 中保留 `results`、`expectedCount`、`issues` 和 `coverage`。

`issues` 项包含 `code`、`message` 和可选 `item`。

`data` 另含 `documentUuid`、`checkType`、`inputs`、`timestamp`、`upstream` 及汇总字段 `upstreamPassed`、`complete`、`passed`。

`upstreamPassed` 为兼容保留的字段名，表示复用并适配后的各项结果是否全部为 `success`。

不表示官方在线服务已通过，也不表示算法逐行保持原样。

菜单与 TXT 将其标为“逐项检查通过”。

单项检查通过不等于整项检查通过。

只在 `complete:true` 且 `passed:true` 时可报告该命令覆盖范围内通过。

`complete:false` 必须同时为 `passed:false`。

命令回包 `ok:true` 只代表处理器成功返回，不代表 `data.passed:true`。

三类检查分别保留预期的 18、7、1 项原始结果。

若用于本次检查的必要输入不完整、读取失败或使用回退/推断值，适配层会标记未完整。

不能报告完整通过。

例如源码读取失败、网络数据只部分可读、焊盘尺寸缺失或无板框而使用回退，都不能变成通过结论。

铜厚请求参数不会默认。

图纸源铜厚按下一节单独处理。

查看 `coverage`、完整性标记及 `upstream` 说明，勿只看 `passed` 或问题数。

## 4. 核对未覆盖内容

这些检查复用上游插件的参数表和算法，不是嘉立创在线 DFM 服务的全量检查，也不是可制造性放行。

当前几何覆盖有明确近似：线间距只计算 `Line` 的正间隙，不覆盖接触、重叠、`Arc` 或 `Polyline`。

长圆及不等边焊环按最大轴近似。

同网焊盘间距采用胶囊体和内接圆近似。

有效铜层按存在铜图元的层启发式计算。

EIA/BGA 类型依据名称识别。

定位 ID 由两组列表索引辅助匹配，问题位置可能有偏差。

菜单定位仅辅助查看。

不能自动改图。

请把原始结果和 `coverage` 一并交由工程人员审阅。

## 5. 菜单定位与报告导出

PCB 顶部“嘉立创下单检查”菜单提供上述三项检查，与 AI 命令共用同一检查处理和结果汇总。

菜单可显示逐项结果及问题位置。

用户点击“导出TXT”或“导出JSON”后，宿主保存对话框用于选择报告保存位置。

AI 命令不弹窗、不清日志、不自动写报告。

命令执行本身不保存、修复、上传或下单。

定位是辅助查看。

不会修改图纸。

菜单或命令开始后若当前焦点或 PCB 身份变化，后续读取及报告交付会停止。

定位前先核对目标 PCB 与当前板一致。

不要把另一板上的坐标用于定位。

旧 DFM 窗口会话失效时，关闭旧窗口并从 PCB 菜单重新打开。

菜单表单、AI 命令及 TXT/JSON 导出应显示相同的 `inputs`、外/内层阈值和 `reportedCopper` 对照。


---

# 网络与生产导出

# 网络类·差分对·生产导出（PCB）

> 本页表格保留选用场景和限制；参数、返回字段与示例以已核对所选窗口版本的 `/help?cmd=<命令名>` 为准。
> 发送 `/command` 时外层必须带 `cmd`、顶层 `instanceId` 和所需 `params`。
> 宏仅外层路由，步骤继承实例。
> 完整示例见 [setup](setup.md)。

本文说明网络约束与生产导出。

## 网络类（NetClass）与差分对

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.createNetClass` | 建网络类（一组网统一设规则/颜色） | 按网络组管理规则时使用。 | 写入未知时停止后续写入。 |
| `pcb.listNetClasses` | 列出网络类 | 按网络组管理规则时使用。 | 按目标实例帮助确认可用参数。 |
| `pcb.deleteNetClass` | 删除网络类 | 按网络组管理规则时使用。 | 先核对目标并备份。 |
| `pcb.renameNetClass` | 重命名网络类 | 按网络组管理规则时使用。 | 写入未知时停止后续写入。 |
| `pcb.addNetToClass` / `removeNetFromClass` | 网络类增删成员 | 按网络组管理规则时使用。 | 先核对目标并备份。 |
| `pcb.createDiffPair` | 建差分对（USB D+/D- 等） | 配置或核对差分信号时使用。 | 写入未知时停止后续写入。 |
| `pcb.listDiffPairs` / `deleteDiffPair` | 列出/删除 | 配置或核对差分信号时使用。 | 先核对目标并备份。 |
| `pcb.getNetRules` | 读当前设计规则中的网络规则（线宽/间距等，**只读**——写入接口结构复杂暂未开放） | 核对当前线宽和间距规则时使用。 | 只读规则，不提供规则写入。 |
| `pcb.getNetLength` | 网络已布线总长度（等长检查用） | 比较实际布线长度时使用。 | 按目标实例帮助确认可用参数。 |
| `pcb.getNetInfo` / `getNetPrimitives` | 网络详细信息 / 网络上全部图元（走线/过孔/焊盘） | 分析指定网络连接对象时使用。 | 按目标实例帮助确认可用参数。 |
| `pcb.highlightNet` | 高亮/取消高亮网络（排查用） | 定位对象或排查连接时使用。 | 按目标实例帮助确认可用参数。 |

## 选择/交叉探针

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.select` / `pcb.clearSelection` / `pcb.getSelection` | 按 ID 选中/清空/读当前选择 | 读取或调整当前选择时使用。 | 按目标实例帮助确认可用参数。 |
| `pcb.crossProbe` | 交叉探针：位号/引脚/网络在原理图↔PCB 间联动定位（高亮+选中） | 定位对象或排查连接时使用。 | 按目标实例帮助确认可用参数。 |

## 原理图NC、属性与图像

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `schematic.setPinNoConnect` | 给引脚打/取消 X 非连接标识（消除悬空引脚 DRC 提示） | 标明合法悬空引脚时使用。 | 标NC的引脚不能继续接线。 |
| `schematic.getAttributes` / `setAttribute` | 读/改图元属性（key=Designator/Value/Footprint 等） | 核对或更新图元已有属性时使用。 | 只能修改图元已有属性。 |
| `schematic.getSelection` | 读当前选中的图元 | 读取或调整当前选择时使用。 | 按目标实例帮助确认可用参数。 |
| `schematic.exportBom` | 导 BOM（xlsx/csv，base64） | 备份、交付或独立检查时使用。 | 导出成功不等于内容验收通过。 |
| `schematic.exportPng` | 导原理图 PNG（单边最大 4096px） | 备份、交付或独立检查时使用。 | 单边尺寸不超过4096px。 |
| `schematic.listNets` | 原理图全部网络（`detail:true` 带可归属导线明细） | 核对已有网络范围时使用；EDA 4.1 自动网导线可能无法归属，需用网表核对。 | 按目标实例帮助确认可用参数。 |

## 生产导出（base64 自行落盘）

| 指令 | 作用 | 使用时机 | 限制 |
| --- | --- | --- | --- |
| `pcb.exportGerber` | Gerber 打板文件（通常 zip） | 备份、交付或独立检查时使用。 | 导出成功不等于内容验收通过。 |
| `pcb.exportPickPlace` | 贴片坐标（Pick&Place），`unit=mm|mil`，默认 mm。 | 备份、交付或独立检查时使用。 | 核对文件中实际坐标与单位；导出成功不等于内容验收通过。 |
| `pcb.exportDsn` | v0.20.60 安装版在实例 `e12f68c0` 的 PCB2 导出槽孔 clearance 11.811 mil、两个 Inner1 实填充平面，`warnings:[]`；保存重开后 DSN 字节一致。 | 交给外部自动布线器时使用；省略文件名时使用 `board`。 | 该验收只覆盖指定工程及导出样例；v0.20.61/.62 未增加 PCB 导出行为或宿主验收。官方 FreeRouting JAR 2.5.0 探针中 8 mil 有目标违规，12.5 mil 未新增探针违规；板上预置违规仍在，SES 未回灌，不表示整板 DRC 或布通通过。补偿可能使部分过孔或焊盘更严格；`planeSlotEquivalent:false`、`routingConstraintsComplete:false`。具体匹配范围见[PCB 操作流程](commands-pcb.md)。导出后仍须检查内容。 |
| `pcb.exportNetlist` | PCB 网表。<br>0.10.104 起拒绝零字节文件及空 base64，导出后仍须解析核对 | 备份、交付或独立检查时使用。 | 0.10.104 起拒绝零字节文件及空 base64，导出后仍须解析核对。 |


### v0.20.69 自动布线规则报告

`exportDsn` 与 `autoRouteStart` 返回 widthRuleComparison；`importAutoRouteSes` 返回新增线段的 widthRuleCompliance，独立于 sesGeometryVerified。`automaticNeckdown` 默认 false，显式 true 才开启。规则差异、已确认违规与未知范围分别报告，不静默改宽、不恢复自动回灌或持续锁。参数及范围见[PCB操作流程](commands-pcb.md)。安装版已通过EDA 4.1.78默认false／显式true服务读回、两种越界拒绝及两组合法SES保存重开，DRC均0。未验证缩颈几何效果差异，完整布线约束仍未覆盖。

## 图纸厚度原值与下单铜重（0.20.74候选）

当前宿主的 `LAYER_PHYS.thickness` 单位尚未核实。`reportedCopper.layers` 保留 `rawThickness`、`sourceType`、`sourceId`、`sourceTicket` 和 `unitStatus:unconfirmed`。不将原值换算为mil或oz；兼容字段 `thicknessMil`、`copperOz` 保持null。

`matchesTarget` 保持null，`differences` 为空；这表示没有可靠的铜重对照结论。`status:available` 只表示所需原始记录可靠取得，不表示单位、铜重或订单已确认。缺记录、非法身份或日志冲突分别报告partial或unavailable。

`pcb.runDfm` 仍按调用方明确提供的外/内铜重执行制造能力检查。原始厚度旁证未知不单独造成DFM失败，也不能代替订单核对。界面和TXT/JSON报告保留相同的原值与未知单位说明。

### 0.20.74厚度原值回执限定实机验收

EDA4.1.78独立B123工程的四铜层原始值与源码保持，来源身份和ticket可读，mil/oz兼容字段与matchesTarget均为null，没有继续误报铜重匹配。输入铜重的制造能力检查保持，193条设计记录data保持。测试页独立无网焊盘使整体DFM仍不完整；此结论只验收原值回执，不是整板DFM通过或订单确认。

## 同一份制造参数用于设计、计算和下单（0.20.77候选，安装版待验）

`pcb.checkManufacturingProfile`只读核对声明参数及当前PCB规则，不保存参数、不改板、不下单。将一份可移植JSON文件作为参数来源，调用时读取文件内容传入`profile`。不要把参数写进用户的工程描述，也不要把扩展本机配置称为随工程保存。

`profile`的字段如下：

| 字段 | 内容 |
| --- | --- |
| `schemaVersion/profileId/revision` | 版本固定1、唯一参数文件标识、修订标识 |
| `manufacturer/productType/stackupId` | 明确板厂、产品类型和具体叠层名称 |
| `source` | `{url,observedAt}`，实际来源和查询时间 |
| `selection` | `{copperLayers,nominalThicknessMm,outerCopperOz,innerCopperOz}`，选择铜层数、名义板厚、内外铜重 |
| `officialStackup` | 同一`stackupId`及`orderedLayers:[{name,kind,thicknessMm,material?,dk?}]`；kind为copper/prepreg/core，未知厚度或Dk用字符串unknown |
| `officialStackup.finishedThicknessMm/finishedTolerancePercent` | 可选，叠层明确列出的成品厚度和厚度容差，不是阻抗保证 |
| `calculations` | 可选计算记录数组，字段见下文 |

铜层数多于2时，selection.innerCopperOz必须给出正有限数值。一层或两层板必须省略内层铜重，不能填假值或null。订单selection使用同一条件；缺少订单不能用内铜不适用掩盖。

每条计算记录使用`id/stackupId/source/evidenceStatus/model/targetOhm/signalLayer/topReference/bottomReference/widthMil/spacingMil/copperGapMil/widthSpacingComplement/bindings`。`evidenceStatus`为verified或unverified；verified只代表调用方提供的可见计算证据，插件未独立认证。orderedLayers按从顶到底排列，全部层名必须唯一。signalLayer及参考层必须引用文件内铜层名称。上参考层必须在信号层之前，下参考层必须在信号层之后。明确无某侧参考层用null；尚未确认则省略该字段。不能用null表示未知。

`model`为single-ended-non-coplanar、single-ended-coplanar、differential-non-coplanar或differential-coplanar。差分模型才使用`spacingMil`线间距，共面模型才使用`copperGapMil`对地间距。未适用参数不要填0。`widthSpacingComplement`记录计算器实际补偿开关，不默认关闭。该开关不是阻抗容差。

`bindings:[{net,edaLayerId,layerMappingSource}]`明确网络和EDA层身份及映射依据。制造层名L1不能直接当成EDA layerId。同一份文件中，制造信号层与EDA层身份必须保持一对一；同一映射可供多个网络使用。没有映射时不猜网络，也不回退默认规则冒充该网络的已知规则。

`orderConfirmation`必须是实际确认记录，包含`schemaVersion:1/confirmed:true/source/manufacturer/productType/stackupId/selection`。计划值不能作为已确认订单。`impedanceService`省略表示未知，null表示明确未开通；开通时提供`{source,calculations:[{id,targetOhm,model,signalLayer,topReference?,bottomReference?,widthMil?,spacingMil?,copperGapMil?,widthSpacingComplement?}]}`。订单与profile中的计算id对应。此记录来自调用方，不是插件从订单网站独立读取。

回执`items`逐项给出matched/mismatch/unknown/not-applicable及双方值、单位、来源和原因。`overall`为mismatch、incomplete或matched-within-scope。缺少必需证据不能总通过。现有EDA4.1.78物理单位和层序仍未确认，整体会保留未完成；原始LAYER_PHYS记录可能包含历史及墓碑，不能看作已生效叠层。

名义1.6mm和某叠层标注的成品1.59mm是不同定义，分别比较。铜重选项与逐层厚度也分开记录。芯板“with copper”组说明不能额外当一层相加。不要从通用FR4参数补该叠层Dk，不从近似公式生成生产保证。

官方来源：[叠层页](https://jlcpcb.com/impedance)、[阻抗计算器](https://jlcpcb.com/pcb-impedance-calculator)。本轮浏览器看到的14.12mil仅保留为unverified开发样例，不是内置默认值、生产选型或已确认订单。

### 来源地址结构校验（0.20.77候选）

0.20.76安装实测在来源参数校验时误拒绝合法网址，未进入工程读取。原实现依赖`new URL`并把所有异常误归为输入无效。本地移除该构造器后可复现；这不是已直接测得宿主全局对象的结论。

0.20.77对profile、计算记录及订单记录的来源统一进行本地绝对地址结构校验。HTTP(S)检查主机、authority和端口；file/mailto/urn等绝对scheme继续支持。中文路径与结构合法的国际化主机保留原值。拒绝相对地址、控制字符、原始空白、破损百分号及畸形authority。

此检查不依赖浏览器URL构造器，不联网，不修改地址，不做完整WHATWG/IDNA解析或规范化。地址结构通过不表示来源真实，也不把unverified改为verified。首次修复候选仍需安装版验收，不把本地回归代替宿主结果。

### 0.20.77 来源兼容与部分只读场景已验

EDA4.1.78独立B123工程中，同一份0.20.76失败样例已正常返回。四铜层匹配；六层对四层、名义板厚差异均能检出。错误目标、非法来源和反向参考层均明确拒绝，之后独立正常查询不受持续锁定。

18项独立核对通过。194条设计记录原始行保持，工程和目标页保持。核对未写入、保存或修改订单。相同/不同订单字段使用明确标为测试用途的合成记录，只证明比较分支，不是实际订单确认或生产参数。

未验证计算仍显示unknown，缺订单不返回总体通过。实际规则报告含停用内层及空网络选择器相关unknown，因此当前已知网络首选线宽/min-max比较分支尚未实机验收。物理叠层单位/顺序、完整阻抗和真实订单一致性均未因此确认。

### 线宽配置读取适配（0.20.78候选）

共享线宽读取跳过明确status为0的停用SIGNAL层，保留1/2启用层；缺失或非法状态仍为未知，全部停用仍没有可确认的启用层。完整层列表仍参与前后稳定性检查。

EDA4.1.78下，严格符合已识别形态、且仅配置NET_LENGTH_TOLERANCE的NET选择器不再当成TRACK选择器。它必须是普通parent:null、ruleOrder:4，两个层覆盖对象均为空，长度值为明确的[规则名,目标网络或null]。不猜空网络名是通配符还是无网对象。含TRACK、未知规则键、非空父项或覆盖、其他scope及删除/冲突处理保持原有边界。

这是配置读取与比较适配，不证明宿主执行DRC或实际阻抗合格。未确认订单、物理单位/顺序和未验证计算仍不能总体通过。共享解析也供DSN/SES使用；未恢复自动回灌，不改原线宽或规则。

官方按规则类别分槽的依据：[选择器格式](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/rule_selector.md)。此格式定义只支持配置分类判断，不把它扩展为宿主运行时或制造保证。

### 0.20.78 线宽读取与比较分支限定实机验收

EDA4.1.78、B123独立工程完成29项核对。四个启用铜层被正确识别；+5V首选20mil、ACE_VIA首选10mil，当前允许范围均为5–100mil。两处原有规则读取误报在安装版消失。

合成计算记录测试了首选匹配、偏离首选但仍在允许范围、超出允许范围，以及未验证计算和不存在网络。后两类仍明确返回unknown，不回退默认或提升验证状态。合成记录只证明比较功能，不证明真实阻抗或订单。

四层/六层差异、调用方订单记录板厚差异、错误目标、非法来源、反向参考层及报错后正常读取均通过。194条设计记录原始行保持，工程和文档身份保持。所有操作只读，未保存或关闭重开，也未改规则或订单。

历史0.20.77的已知线宽分支待验状态由本节更新。当前B4规则读取和比较分支已完成限定验收；物理叠层单位/顺序、真实计算和订单一致性仍未确认。routingConstraintsComplete仍为false，不代表整板布线约束、DRC或生产全部合格。

### 指定路径差分走线（0.20.79候选，安装版待验）

`pcb.routeDiffPair` 按中心路径生成正负两条耦合折线。调用前查询当前窗口help。`pair` 明确提供 `{positiveNet,negativeNet}`，两个网络必须存在且不同。`path`、`width`、`gap` 使用mil。gap是铜边距离，中心线距离为width+gap。

正侧按路径前进方向的数值法向 `[-dy,dx]` 偏移，负侧反向。屏幕视觉左右取决于坐标方向。反转path会交换两根线所在的空间侧，不会交换输入网名。

先用 `dryRun:true` 读取并预览；省略或false时执行写入。指定层须为已启用SIGNAL层。只删除几何等价的连续重复点和同向共线中间点，不吸附或拉长输入。生成段沿用最短1mil；反转、自接触、正负任意段间距不足或数值不可靠时，整对写前拒绝。

两侧共用文档与时间预算。逐段读回，并核对最终源码覆盖、非LINE记录和规则保持。中途失败返回partial及已完成侧和失败候选证据，停止后续步骤；超时不取消宿主操作，不重发、不自动删除或回滚。后续独立命令不受持续锁定。

`plannedLengths` 只表示本次计划路径，不是整网实测长度。转角造成的两线长度差会明确返回。该命令不自动避障、蛇形调长、并联重复焊盘或建立差分规则，也不自动保存。成功后仍按项目要求核对实际连通、全板DRC、参考面和长度差；不从创建成功推断阻抗合格。

```json
{"cmd":"pcb.routeDiffPair","params":{"pair":{"positiveNet":"USB_DP","negativeNet":"USB_DM"},"path":[[100,100],[300,100],[500,300]],"width":6,"gap":4,"layer":"top","dryRun":true}}
```

示例数值仅演示参数，不是USB设计参数。生产线宽/线隙应使用同一份有来源的叠层和计算记录，与规则及实际订单核对。差分等长容差按具体接口要求确定，不默认套用10mil。

### 0.20.79 指定路径差分走线限定实机验收

EDA4.1.78独立B123工程通过21项核对。dryRun及七组错误输入保持原图，报错后可正常执行。直线与45°转角两组共6条LINE完成创建读回、保存关闭重开；原194条记录保持，全部200条保存记录重开后保持。

直线两侧源码长度均200mil。45°组源码长度为235.6223648810721和247.2203475935823mil，差11.5979827125101mil。这是本次路径的源码测量，不是整网长度或实物测量。

请求gap为8mil，直线源码gap为8mil；45°源码最小gap为7.9998657393562mil，少0.0001342606438mil。宿主把坐标存为四位小数，最大单坐标偏差0.00004746830584mil，在事先公开的0.001mil读回容差内。首轮额外1e-9mil核对未通过，原证据保留；不能写实际gap严格不小于8mil。

原生DRC只列9项Connection Error，未列间距错误。测试走线未接入功能接口，不代表整板DRC、连通、等长或阻抗通过。蛇形补偿和Type-C重复脚分支尚未实现。本节更新前文79候选待验状态，旧冻结包不改字节。

### 蛇形补长（0.20.80候选，安装版待验）

`pcb.tuneLength` 在指定区域给开放走线链补长。`net`、`targetLength`、`region:{xMin,yMin,xMax,yMax}` 使用当前PCB的网络和mil坐标。`targetLength` 是所选链的中心线总长，不是整网所有支线的长度之和。

用 `primitiveIds` 明确选择同网、同层、同宽且未锁定的开放单链。省略时，net与region须完整包含唯一候选直线。`tunePrimitiveId` 可指定其中一个调节段。指令只替换该段，其他选中段保持。region限制新增铜轮廓，调节段两端须完整位于区域内。

先用 `dryRun:true` 查看计划。省略或false执行写入。`side` 为auto、left或right，方向相对按端点坐标排序后的路径，正法向为[-dy,dx]。auto会试两侧和可用调节段。找不到当前蛇形族时返回原因，不代表所有布线形状都无解。

按D12优先使用可确认适用的项目规则。当前SDK没有可靠的局部蛇形容差、自间距读取接口，因此必须明确填写 `lengthTolerance` 和 `minSelfGap`。前者是累计总长误差，后者是涉及新增蛇形的非相邻线段铜边间距，不重新要求两段未修改旧线达到此值。不得用差分gap、差分默认10mil或网络相对长度容差代替。几何读回容差0.001mil与累计总长容差分别使用。返回parameterSources说明显式参数与当前未确认适用的规则映射，不声称已从工程自动取得数值。

目标已经在总长容差内时返回changed:false，不写入。目标更短且超出容差时明确报错。生成线段沿用最短1mil要求。原线中途接有支线、焊盘或过孔时，必须确认连接会保留；不能确认则写前说明对象及原因。特殊外形、跨层范围或覆铜实际接触不明时不猜测。

执行时先创建新局部路径并读回，确认原线和非目标记录保持，再删除明确的原调节段，最后核对枚举、源码及实际总长。失败可能返回partial、新线ID、删除尝试和旧旁路状态；unknown表示无法确认。此时停止依赖该结果，不自动重试、回滚或保存，后续独立命令不受持续锁定。

返回的计划长度和实际长度仅针对本次选中链。实际最小间距如实报告，不夹到请求值。成功不代表全板间距、连接、阻抗或制造通过；仍需按具体接口及实际叠层核对。Type-C重复脚分支与自动布线流程另行开发。

参数示意：选中一条200mil测试直线，目标220mil，明确提供lengthTolerance与minSelfGap，再dryRun预览。示例长度和容差由测试目的选择，不能当作USB、DDR或其他接口的默认设计参数。

### 0.20.80 蛇形补长限定实机验收

EDA4.1.78独立B123工程完成23项核对。只读预览、八组错误输入、目标已达到不写及报错后正常调用均通过。八组错误输入和预览保持原有200条设计记录。

第一组把200mil直线替换为四段蛇形，实际中心线总长219.999952549915mil。第二组对两段开放链中的200mil直线作相反方向补长，另一条70.71067811865476mil斜线ID和数据保持；整链实际长290.71063066856976mil。两组与各自目标的误差均约-0.000047450085mil，符合明确提供的0.01mil总长容差。

两组实际涉及新增蛇形的最小铜边间距为30.66661456870542mil，测试要求8mil。宿主源码坐标四位小数，最大单坐标误差0.000047683481mil，小于公开0.001mil读回容差。数值是测试路径测量，不是生产默认参数或整网电气长度。

两条旧调节段确认删除；其余198条原记录保持，另创建8条蛇形LINE和1条链端斜线。保存、关闭、重开后全部207条记录的数据及header保持，旧段未恢复。

重开后原生DRC仅列11项Connection Error。专家与原9项对比：原有7个对象保持，两条旧孤立直线的2项变成新开放链首末段4项；新旧相邻接口未单独报错。这更支持开放端归并报告，但不是原生连通分量证明。保留connectivityVerified:false、boardClearanceVerified:false、impedanceVerified:false；不自动刷新端点或将几何成功写成电气通过。

旧候选包的字节保持。当前自有技能状态由本节更新；Type-C重复脚分支及B6另行处理。原连接保护的T支线、焊盘、过孔、未知对象与异常写入分支已做本地回归，不能把它们全都称为本轮实机覆盖。

### 圆弧蛇形修订（0.20.81候选，安装版待验）

用户明确要求圆弧蛇形。本版 `pcb.tuneLength` 使用真实LINE与相切ARC，不用细碎折线模拟圆弧。0.20.80的23项结论仅保留为旧三角折线几何与保存证据；圆弧样式须重新验收。

沿用net、targetLength、region、primitiveIds、tunePrimitiveId、side和dryRun。新增必填 `bendRadius`，单位mil，表示圆弧中心线半径。优先使用能确认适用的项目规则；当前SDK尚无已核实的局部蛇形半径、容差和自间距映射，因此明确填写bendRadius、lengthTolerance、minSelfGap，并返回参数来源。不设通用生产半径，也不套用差分默认10mil。

每个圆角U形单元由四个90°圆弧、往返腿和顶部直线构成。单元完整覆盖待替换段，不创建与旧基线重合的引线。按固定半径搜索可行单元数；零长直线省略，非零短图元沿用当前1mil输入政策。给定半径、空间、间距和补长量不相容时明确报错，不静默修改半径或退回折线。

总长包含真实弧长。弧顶、扫角内极值及半线宽参与区域检查。圆弧仅为接触计算生成带弓高误差界的采样弦；这些弦不会写入PCB。往返间距按此解析曲线族检查，并与原接入保护分别处理，不能把相邻圆角的构造分段当作独立支路误拒。

逐图元创建并读回LINE或ARC。ARC核对类型、端点、扫角方向、半径及真实弧长；合法反向存储必须同时交换端点和反转扫角。用于后续计算的实际曲线按计划方向排列，保留实际读回偏差。确认新路径和旧数据保持后，只删明确的原调节段，最终分别核对源码、两类SDK枚举、规则和总长。

dryRun预览返回真实图元计划及采样规模，不返回大量计算用微小弦。成功回执区分计划和源码读回的蛇形族间距下界；这不是全链或整板实测最小值，也不比较两段未修改旧线的间距。未知写入partial停止，保留typed创建ID、删除尝试、确认删除与旧旁路状态，不自动重试、回滚、保存或持续锁定。

原生连通、阻抗、参考面及全板DRC仍需按实际项目核对；不能从圆弧几何读回推断通过。测试半径由测试目的明确选择，不能变成USB、DDR或制造默认值。

官方依据：[90°圆弧等长样式](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/index.html)、[ARC接口](https://prodocs.easyeda.com/en/api/reference/pro-api.pcb_primitivearc.create.html)、[PCB ARC格式](https://github.com/easyeda/easyeda-format-skill/blob/main/primitives/PCB/arc.md)。接口及格式声明不代替当前宿主实测。

### 圆弧端点读回兼容（0.20.82候选，待验）

0.20.81实机在第二段圆弧读回时停止。原207条记录和旧测试直线保持，没有尝试删除原线。第二ARC源码为正确DOT负90度圆弧，不能因SDK属性校验失败就判为画错方向。

0.20.82增加按显式类型和ID读取fresh getter的只读诊断 `pcb.inspectCurveReadback`。具体参数以当前安装版help为准。诊断返回SDK getter值、同ID源码和差异，不创建、删除或保存图元。

圆弧写入检查兼容有精确源码约束的一位小数SDK端点投影。只适用于ARC端点；类型、ID、网、层、线宽和带符号扫角仍严格核对。源码DOT几何仍按0.001mil检查，长度、圆心、半径和接点按精确源码计算。舍入边界不能确认时明确报错，不把普通0.05mil误差当作等价。结果披露实际读回模式与SDK原值。

候选安装后先对现有失败ID做只读诊断，确认fresh getter符合该表示差异，再进行新的写入和保存重开验收。当前模拟输入来自失败源码及批量接口，不代替fresh getter或安装版验收。

### 多单元圆弧与旧旁路分段（0.20.83限定实机通过）

0.20.82安装版已用fresh getter证实ARC端点的一位小数表示差异。单U的四ARC、三LINE写入成功，实测220.000097150257mil，明确容差0.01mil；保存关闭重开保持。此结果不代表多U、全板连通或阻抗通过。

多U中间接点触到原直线时，当前EDA会把原target自动拆成新ID的分段。0.20.82在主动删除前停止，旧旁路铜路径仍由两条分段保持。该失败现场的235条记录已保存重开保持。

0.20.83保留真实圆弧规划，只识别明确目标直线的完整分段替代。除目标外的原记录必须完整保持。扣除writer创建的有类型ID后，所有额外记录都必须是新ID的LINE；除端点外完整属性须与原target相同。分段须共线、无重叠缺口覆盖原区间，内部切点只能来自本次计划的基线接点。不根据相同网络或相近位置猜归属。

新圆弧、长度、接点、源码及旁路分段fresh SDK全部确认后，才删除确定归属的旧旁路ID集合。回执分别说明原target、宿主替换的ID、旧旁路分段、写入的新路径和命令实际确认删除的ID。未知或部分删除停止，不自动重试、回滚或持续锁定。

0.20.83已完成两项相关回归、类型检查、同专家复审、构建及72文件包检查。EDA4.1.78安装版的单U和双U真实LINE/ARC写入、旧旁路删除及保存关闭重开通过。清洁单U目标220mil，实测220.000097150257mil；双U含尾线目标338.309518948453mil，实测338.309713248967mil。明确长度容差0.01mil、半径7mil、自间距8mil仅用于该测试，不是生产默认值。两次原235条记录保持，清洁对照后264条记录data与header保存重开保持，16条新ARC的fresh getter分批读回均无差异。错误参数和dryRun不写入，后续独立指令仍可用。

双U原target由宿主替换为两条旁路分段，插件确认归属后只删除这两条分段，保留尾线。回执分别披露宿主替换与命令确认删除。原失败现场继续保留，不自动清理。

原生DRC仍未全板通过：保留的早期单U选位碰撞产生4项间距错误，另有18项连接错误。清洁单U与本次双U没有被报告间距错误；这不是原生连通分量、阻抗或生产验收。不能从圆弧几何和长度通过推断这些项目通过。

## 0.20.115集中开发候选（SES既有ARC保护链去重）

本候选为`pcb.exportDsn`、`pcb.autoRouteStart`和`pcb.autoRouteGetResult`提供与本次布线器实际输入DSN对应的`routeBaseline`，供`pcb.importAutoRouteSes`识别SES中的既有ARC保护链。参数结构新增一个可选对象；AI应保留布线前`pcb.exportDsn`的原返回对象，并将其中的`routeBaseline`原样传入导入指令。

`pcb.exportDsn`按有效PCB源码和实际最终DSN生成导出记录；调用方须保留这份返回对象及对应DSN，确保它就是交给布线器的输入。导出记录绑定`documentUuid`、当前有效DOT ARC源码记录，以及实际DSN中与ARC一一对应的完整`protect` wire和坐标点列。源码、层映射或实际DSN不能完整关联时，`routeBaseline.status`标记为`incomplete`并说明问题，不能用来消解ARC保护链。`pcb.autoRouteStart`只在DSN已成功提交到服务输入后，将导出记录与job绑定；`pcb.autoRouteGetResult`在可取得该job关联的导出记录时随取回结果返回。若任务映射不可用，必须使用布线前已保留且对应本次输入DSN的`pcb.exportDsn`返回对象；没有这份旧记录，就不能证明旧任务期间ARC未变。事后重新导出不能替代。

### 导入时的精确关联条件

`pcb.importAutoRouteSes`接收原始SES及可选`routeBaseline`对象。导入前核对当前PCB UUID、对象中的ARC有效源码记录和完整DSN点列，并重新导出native DSN；当前源码快照须稳定，重新生成的导出记录须完整并与传入对象匹配。随后将每个既有保护wire与SES按wire类型、网络、层、线宽和全点列精确匹配。完整反向点列允许，少点、额外点、切分、重复、同端点改线或源码缺失／变化均拒绝。

确认的既有ARC保护链从新增差集排除，并在`existingArcCoverage`报告ARC ID、DSN/SES wire序号、保护段数及方向。导入不改写调用方传入的SES；只把差集转换为写入计划。真实新增走线仍经过原有线宽范围、最小线段长度和几何读回检查；新增过孔继续使用原有孔径和几何处理。重复提交已经完整存在的几何会返回`alreadyPresent`，不重复写入。

不含既有ARC保护链的普通手工SES可以省略`routeBaseline`。若未提供`routeBaseline`但SES中有可对应当前ARC的保护链，指令会在写入前拒绝；不猜测其是不是新增线。

### 支持边界与候选状态

只处理当前有效源码中可确认的有限、非退化DOT ARC及受支持铜层，并要求对应当前实际native DSN点列完整、唯一、稳定。ARC链匹配仅在本批已验证的mil/1000坐标下确认；其他单位归一化即使差异仅1ULP，也可能被精确点列比较保守拒绝。没有ARC保护链的普通inch/mm导入继续原路径。

含多个path、且其中可能混有既有ARC保护链和新增线的wire，本候选在写入前拒绝，不静默消掉其余path。没有ARC保护链的普通multi-path SES保持既有处理。最终候选回放含此拒绝反例；专家针对P1确认该拒绝已关闭，生产源码无可行动问题。最终命令回归使用一致mock夹具，通过source与SDK一致性验证，重复提交零写入；freshDSN、source、focus及multi-path拒绝均通过。

完整反向点列允许；被拆分、重采样、缺链、复制或来源变化的保护链不能通过验证。本候选不宣称支持所有ARC格式或变换方式。

没有保留同一工程完整的导出记录时，当前被删改到无关处的ARC不能证明其历史来源；本功能不检查所有历史改动。114限定顶底OVAL/ARC实机记录及其组合导入未通过结论继续保留在下节，不能因本候选源码回放而改称114组合验收已通过。

独立真实候选回放基于冻结114输入，覆盖3条ARC及89个既有保护段；预期差集为9条LINE和3个VIA，重复差集为0条LINE/0个VIA。19项拒绝反例通过，完整反向保护链通过。14项相关回归、标准`tsc --noEmit`和构建通过。专家复审确认multi-path拒绝已关闭，生产源码无可行动问题。最终命令回归使用一致mock夹具，通过source与SDK一致性验证，重复提交零写入；freshDSN、source、focus及multi-path拒绝均通过。包信息待主代理填写。0.20.115安装后的限定实机结果见本专题开头。

## 重复焊盘分支

### 0.20.114限定实机验收（分支通过，组合导入未通过）

顶层和底层OVAL/ARC分支均完成写入、保存和关闭重开核对；每个工程新增4条LINE，原图元保持，目标DRC为0。全板仍有15项违规。同一次同源DSN/SES组合导入未通过：89段既有ARC完整折线被识别为新增，其中53段源自既有`+5V` ARC，线宽20mil；因来源尚未关联，被按新增线段核对并触发25–35mil规则，在写入前拒绝，零写。布线服务返回`COMPLETED`仍有1条未布通连接和4项既有警告，不能据此称整板已布通。R5正在补齐既有ARC完整折线关联去重；用户已同意完成后额外统一导入一次验收。

### 0.20.114 OVAL焊盘与圆弧主干集中开发候选（待安装验收）

本候选为`pcb.routePadBranches`增加普通、无孔、外层OVAL胶囊形PAD起线，支持横向、纵向、旋转和等宽退化为圆形。模型按胶囊形端帽计算，不按椭圆处理。带孔、偏心OVAL及特殊层不扩展支持范围。

独立PAD优先采用有效source的精确尺寸。EDA 4.1.78 getter尺寸只有精确匹配或已实证的最近0.1投影可接受，并在结果中披露投影delta。器件PAD继续采用本次`getAllPins()`的SDK全局锚点和SDK模型精度判断，不改变嵌入封装source精度与误差界未确认的边界。

`trunk`仍使用现有`primitiveId`与`endpoint`字段，可指向LINE或经验证的ARC实际端点；没有新增接口字段。ARC只有同ID存在有效source，且fresh `inspectArcReadback`读回匹配时才升级为可确认接触。读回失败、缺少source或不一致均保留unknown。圆弧采用带符号扫角参与接触和间距判定。宽带接触、异网间距不足和多个互相分离的接触位置均在写入前拒绝。返回的`arcContactResolution`披露来源状态。

新增`BranchContact`只用于分支路径分析。既有补长逻辑对新接触类型保持保守unknown，不将其误当矩形PAD。此候选不扩大到带孔或偏心PAD、特殊层、全板自动避障或生产连通保证。

源码与本地回归通过，加上0.20.113真实source/getter预检，只说明实现和预检路径具备证据，不代表0.20.114新分支已在EDA实机运行。用户安装一个最终包后再做正式验收；验收需在独立副本检查写入几何、网络和图层，并保存关闭重开复核。

0.20.85 已在 EDA4.1.78 完成三组分支写入、源码几何及保存重开的限定验收。原生电气连通仍未通过验收。PAD 的广泛枚举可能同时包含器件焊盘；插件按实际器件成员确定归属，不用 ID 拼接推断。`pcb.routePadBranches` 用于两条明确信号网络的重复焊盘并联。它与差分主干 `pcb.routeDiffPair` 分开，不根据 Type-C 等器件名称猜脚号、网络或阻抗线宽。

输入 `pair:{positiveNet,negativeNet}`、`layer`、`width` 和 `clearanceMil`。每侧提供 `{joinPoint:[x,y],branches:[{padId,waypoints?}],trunk?:{primitiveId,endpoint:"start"|"end"}}`。单位均为 mil。两个网络必须已存在且不同。`clearanceMil` 是异网铜边间距下限，不是恒定差分间隙；给零也不允许异网接触。最短 1 mil 限制针对非零线段，不是线宽下限。

起点按真实 PAD ID 自动解析。省略 `waypoints` 时直连汇合点；给出时仅填中间点。独立 PAD 优先采用有效源码的精确坐标和支持形状，getter 的已确认十分位投影单独报告，不把源码取整。器件 PAD 使用本次 `getAllPins()` 全局 SDK 锚点，不再次加器件偏移或旋转。器件长度、接触与间距结论限于该 SDK 几何模型，嵌入封装源码精度及误差界仍未确认。

支持形状为可可靠解释的圆形和旋转矩形，以及圆孔镀通孔。通孔可以从孔内起线，连续路径前缀随后需要接触焊环。特殊层或复杂形状不能解释时，错误说明具体 PAD 和字段。附近未知导电形状不能忽略，可靠包围框明确远离时可以排除。

同侧支路可以只在汇合点相接，也可以先合流再共享连续后缀。共同后缀分段点不必相同。先擦碰、分开后再合流，或线路离开目标焊盘后又绕回，会在写前拒绝。指定 `trunk` 时，实际 LINE 的网络、层和所选端点都要与汇合点吻合；不指定时只表示支路相接，不宣称已经接到已有主干。

此指令可直接执行，`dryRun:true` 是可选只读预览；不需要先生成计划令牌。插件串行写入并核对源码几何与完整非几何属性。宿主合法合并或拆分 LINE 可改变 ID；按最终覆盖验证，不因旧候选 ID 消失就盲目补画。部分失败保留已完成线段和失败阶段，停止后续写入，不自动重试、回滚、保存或持续锁定。

每个 PAD 锚点到 join 的长度分别报告。共享后缀可出现在多条路径中，不将这些长度相加当单条信号路径。结果不是整板 DRC、原生电气连通、实际铜皮或阻抗验收；执行后仍按任务要求检查、保存并读回。

### 0.20.85 安装版验收范围

独立圆 PAD 直接分支、小数坐标起点、镀通孔孔内前缀后续接环、共同后缀去重，以及真实器件 PAD 的 SDK 模型起线均完成写入。三组 11 条焊盘路径分别核对长度与源码覆盖。宿主合并共同后缀和已有主干后改变 LINE ID，指令正常确认覆盖，未重复画线。最终 289 条有效记录及属性保存关闭重开保持，原 264 条历史记录的数据保持。

新增对象没有原生间距错误报告；测试板全局仍有 4 条旧间距错误和 23 条连接错误。部分新局部对象也被列入连接错误，原生报告没有提供断开对象对或连通分组。已保存源码未发现预期局部路径的端点间隙、错网或错层，但不能据此排除原生连接问题，也不能将其归因于测试网络未接到其他区域。因此本次只接受已验证的几何、保留性和保存重开结果，原生电气连通、整板、阻抗与生产均未通过验收。

### 0.20.86 普通表贴焊盘的新网连通对照

新建两条具名网络，每网仅有三个普通顶层圆形 SMD 焊盘、两条直线分支和一条主干。复用上次已确认创建的一个焊盘，没有重发。两网合计六 PAD 和六 LINE，完整源码核对通过。原292条记录保持，最终305条记录的 data/header 在保存关闭重开后保持。

重开后的原生 DRC 没有列出这两个新网络或其12个对象的连接、间距错误。因此，这个受控普通 SMD 样例完成限定连通检查。测试板仍有四条旧间距错误和23条旧连接错误；0.20.85 的通孔、器件及旧同网形态没有由此补验通过，其连接报告原因仍未证实。命令本身不自动运行DRC，connectivityVerified仍为false；整板、阻抗和生产不在本次结论内。

## 自动布线结果取回（0.20.87，限定只读取回通过）

保留 `pcb.autoRouteStart` 返回的 `jobId`，调用 `pcb.autoRouteStatus {jobId}` 查询。状态为 COMPLETED 后调用 `pcb.autoRouteGetResult {jobId}`，取得 `fileName` 和 `base64`。取回阶段核对任务身份、格式、Base64、UTF8与当前支持的SES结构，不修改文件中的短线段、坐标、线宽或孔径。

取回不会调用导入、删除、保存或DRC。服务任务的COMPLETED不表示布线完整；有统计时一并判断未布通数量。后续明确调用 `pcb.importAutoRouteSes`，传原fileName/base64并按其要求提供孔径等参数；写前检查仍独立执行。低于1mil的段可以原样取回，但导入仍按原输入政策明确拒绝，不自动合并。是否符合当前PCB图层和规则也由导入及设计检查另行确认。

取回参数必须明确指定jobId。状态查询完成后可能清除“最近任务”，因此不能依赖空参数获取。插件记得启动时文档时只报告已知绑定；未知时不猜当前页。绑定不证明原PCB源码未变。服务文件名仅是结果文件名，不作为本地路径使用。

同一jobId可重复只读取回。超时只表示读取未完成，不重新启动布线，不标记为PCB写入结果未知。插件仍不提供CLI执行服务；CLI发行包与REST服务分开处理。


### 0.20.87 安装版只读取回验收

EDA4.1.78安装版从外部已完成任务取回1861字节SES，并重复取回，文件名、Base64及解码字节均与服务原文件一致。原文档绑定未知时明确返回unknown。随后由插件从当前测试PCB执行Start、Status、GetResult，取回18842字节文件，报告正确原PCB绑定；105条wire、4个via仅是SES结构统计，没有导入。原305条data/header保持，任务为0。空jobId及错文档先拒绝，后续正常独立请求通过。

真实服务日志同时出现COMPLETED和4条未布通、4项violations，因此完成状态不能作为布通或DRC验收。API统计中空对象或缺少未布通字段不能视为0。取回指令保持原文件和服务统计，不自行补齐这些计数。本次未导入该结果，也未运行EDA DRC或保存重开；完整B6流程待单独验收。

首次尝试时临时服务已退出，EDA请求返回HTTP500，直接访问本机端口也被拒绝；未据此修改插件。恢复受控服务后正常读取通过。服务进程退出原因未确认。临时服务已结束，用户全局配置保持。

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

## 0.20.109 B2长圆与双面阻焊开窗（限定实机验收通过）

`pcb.checkSilkscreen` 参数保持不变。0.20.109已在EDA4.1.78完成原RECT、非等径ELLIPSE、普通OVAL、等径OVAL、普通多层圆孔及外层独立SPECIAL共六工程的正式检查和保存重开。12次调用、160个面关联与真实数据重放一致。

### 无孔OVAL与ELLIPSE宽度运行时模型

无孔NORMAL OVAL支持封装局部层1/2。按胶囊轴向几何匹配标准 O 光圈；任意旋转时按完整Oval宏匹配。逐项核对中心、局部核两端点和直径。每个ADD参数独立按五位毫米量化；非该量化网格只允许精确匹配。相关参数精度未确认时保留不确定，不据其他候选确认唯一关联。零核长OVAL按实际宿主结果匹配C圆形光圈；同几何C/O/Oval表示共同参与歧义和精度判断。

非等径ELLIPSE保留源height字段供报告读取，但EDA 4.1.78运行时焊盘与制造开窗按width形成圆形，报告为`sourceHeightMil`与`shapeInterpretation=circle-width-based-runtime`。这不是数学椭圆支持。

### layer12普通ROUND孔双面开窗

支持普通等宽高ROUND孔、PAD用途NORMAL、正top/bottom扩张的layer12焊盘。外层默认形状支持circle、零圆角RECT和OVAL。一个PAD可有两面候选；按`localSurface`选择扩张值，并在组件翻面后映射到GTS/GBS。

SPECIAL仅在唯一条目的`start=end=1|2`覆盖目标外层并匹配对应面形状时纳入。重复或范围覆盖、未知形状或属性、PAD_NET几何覆盖继续返回skipped，不猜测其几何。

`runtimeBBoxModel=default-and-special-union`表示已证明的SDK声明形状聚合范围。四层夹具即时读取、二层夹具即时及保存重开读取都包含default形状；这不表示夹具内物理存在内层铜。每面源几何分别与完整同面Gerber精确匹配。

按完整shapeState逐字段检查精确元组；getter尺寸逐项接受源精确值或该源值按0.1mil舍入后的明确表示。源几何仍使用源精度。可读时，前后`Hole`、`SpecialPad`、孔偏移、旋转和镀层信息也必须稳定。`sourceDrillMetadata`只记录源孔、偏移、相对角度和镀层，不证明钻孔或连通已验证；阻焊几何不扣除孔洞。

### 证据与边界

几何关联仍为`geometry-correlated`，`uniqueSourceAttribution=false`且`complete=false`。原BOX候选仍为`confirmed=false`。制造文字轮廓继续检查，source定位只给候选；Gerber没有对象ID，公开API未证明可按对象ID导出或读取字形轮廓。

本轮每次只读检查的190条设计／49条封装有效数据保持。六组本轮保存前后有效数据保持；等径OVAL相对最初导入取证的5项非几何归一化差异单列记录。原工程已恢复，任务0。

额外Hole／SpecialPad等getter的每个成员可用性未单独观测；本次只确认可读取字段参与的正式快照流程稳定，不扩为钻孔验证。跨层范围、重复覆盖和未证实例属性仍明确未覆盖。文字唯一来源为已确认限制；制造字形检查和源候选保留。整板DRC、所有字体组合及完整B2不称通过。
## 0.20.110 B2剩余功能（部分实机通过）

本节记录封闭图形、运行时扩张和复杂SPECIAL来源的实测及复核。0.20.110原工程及signed/closed/null等隔离副本已完成对应检查。14工程28次保存重开后，300个`geometry-correlated`面和60个闭合面核对保持。rangeinner A首轮有网8面关联通过；无网6个PAD的12个面未关联，但`manufacturing.complete=true`、`sourceStable=true`且`rulesStable=true`。原始失败现场已保存，根因未知。原工程已恢复190/49、task0，未再次升级；B2未完整验收。

### Signed / closed制造几何

支持RECT的`e`为零或负值且剩余宽高为正的R光圈或精确Rect宏表示。矩形宽高和角度成对匹配，角度按180度等价，角度独立使用0.01度网格与0.005度半格界限。C与OVAL只有带符号扩张后的半径仍为正才判为有效。

退化尺寸闭合时，模型预测与`source-copper-region`制造最终paint观察共同判定。状态仅使用`observed-no-positive-area-opening`、`unattributed-opening-present`或`geometry-match-uncertain`；缺少唯一且完整的目标Gerber层时为`not-evaluated`。没有可靠对象引用时不伪造引用。检查只读，比较检查前后的getter扩张值。

70个开放和30个闭合样本的signed ZIP回放通过。112个面数据的16阶段回放全通过；这些回放不表示正式候选指令已在宿主安装验收。

### R1：null扩张的运行时有效值

R1已实现并经专家复审，无阻断项。源扩张严格为`null`时，只使用同一PAD运行时物理面的有限有效值，同时保留源`null`和`runtime-effective`来源。`undefined`、读取异常或非有限值均为未知。显式源值和运行时值矛盾时返回`overrideNeeded`，并继续制造几何通道。

原工程中已测普通null扩张路径通过；这不代表空网API的返回值已查明。

### R2：复杂来源与重复层键

R2双路径适配已实现。第一条路径适用于复杂源声明而SDK层键唯一且恰为`[1,1]`、`[12,12]`、`[2,2]`：按三shape归一化恢复唯一源的精确值。0.1mil舍入只用于已证明的SDK shape getter值，不能用于源尺寸精度匹配。相同多源可归一；精确源值不唯一或舍入碰撞时拒绝关联。

第二条路径适用于复杂源声明且SDK层键重复：通过当前宿主已取证的`pcb_Net.getAllPrimitivesByNet`，按同一PAD运行时网络读取raw数据。必须唯一匹配字符串`globalIndex`与运行时PAD ID，并同时匹配`parentId`、`layerId=12`、`pcbItemPrimitiveType='Pad'`和`net`。缺失、重复或任何字段不一致都作为未知，不猜第一项、最后一项或源优先级。

raw具名`top`/`bottom`表示运行时物理面；`inner`只参与联合bbox，不把其索引解释为铜层ID。按raw的width/height乘10mil建立几何，仅与源完整精度严格匹配，不套0.1mil舍入。只有`ratio=0`且inner各项的`pl=null`可用；其他值保持未知。1/12/2三项归一结果不受raw覆盖。

导出前后分别复核原`SpecialPad`及已消费raw字段。失败时维持未知。报告保留所有源声明和候选索引，不解释通用范围或“最后一条覆盖”语义。

OVAL 80×60的大形状测试覆盖`range=1..15`和`range=2..16`两种A/B设置，证实inner参与联合bbox，而外层仍为default形状。该结论只说明这两种设置的SDK聚合模型，不推广到所有range。

### 保存重开和回归证据

六个SPECIAL工程与一个inherit对照共七工程保存重开后，raw、bbox、实际使用阻焊和49条封装记录保持。每个SPECIAL工程记录数为190，并各有5项非几何规范化差异；设计几何保持。inherit工程记录数为191且无差异。上述配置的0.20.110实测范围有限；111实机空网查询返回空数组，但无网PAD关联仍未通过。主代理后续14工程28次保存重开中，300个`geometry-correlated`面和60个闭合面核对保持。

112个面数据的16阶段回放全通过；70个开放、30个闭合signed ZIP回放通过；15项相关回归和命令43项测试通过。这些属于本地回放与自动测试；0.20.110宿主结果仍按已测路径部分通过记录，B2不称完整完成。

### 未覆盖范围

无网根因未知。可能是SDK空返回、网络null/missing或其他schema差异；0.20.110失败报告没有披露具体阶段，现有`getNetPrimitives`拒绝空字符串网络值。不要据此指定根因。用户已确认暂保留实例几何与阻焊覆盖的源关联限制；制造图形检查继续执行，源关联未知不视为该类实例覆盖已验。来源归属、完整性及整板DRC边界继续沿用[0.20.109专题说明](#020109-b2长圆与双面阻焊开窗限定实机验收通过)。

## 0.20.111 空网查询实机历史记录（当时未通过，已由112补齐）

0.20.111当时连接instanceId为`afcca83d`。rangeinner A的`pcb.getNetPrimitives({net:""})`返回`ok:true`和空数组，`+5V`返回2个raw PAD；正式检查为8/20面关联，无网6 PAD／12面未关联。历史证据保留于`evidence/v111-host-rangeA-empty-net.json`、`v111-host-rangeA-power-net.json`和`v111-host-rangeA-check.json`。该失败是111当时状态，112验收结果见下节。

## 0.20.112 B2空网DSN适配（实机验收通过）

### 指令行为与返回字段

`pcb.checkSilkscreen`参数不变。仅在空网补充读取成功返回空数组、目标运行时ID匹配数量为0时，插件才按需读取原生DSN。前后DSN文本、设计来源、规则及运行时快照须稳定；DSN读取失败或变化时保留该来源关联未知，制造检查继续并保留自身结果。

来源身份由有效`PAD_NET`、当前封装PAD和实际运行时PAD绑定。已验证的canonical `eN`局部ID转换须无全局碰撞；DSN pin实例唯一，其stack引用解析到唯一定义。共享stack本身允许。当前适配单image `u1`、零平移、front、零旋转的扁平放置，pin坐标独立核对运行时精确铜范围中心。

DSN只独立选择物理顶／底面形状。C直径、RECT完整四角和OVAL完整n12／n13半圆序列分别核对；导出值须在0.01mil网格，误差不超过0.005mil加纯浮点余量。polygon的`0.1`只识别已验证的序列化模式，不用于扩张铜形状，也不把导出多边形当成精确铜轮廓。不同完整精度源形状均能解释同一输出时保持unknown，不通过Gerber挑选来源。

铜范围由SDK实际返回的全部special tuples恢复唯一完整精度源形状后取并集，忽略重复层键的物理面含义，不额外加入已被覆盖且未返回的旧声明。DSN inner数据不完整，不参与这项范围判定。制造开窗最后仍由同次Gerber独立匹配。

顶层`nativeDsnOuterSelection`返回`requested`、`status`、`stable`及不可用时的`reason`。`sourcePadModel.dsnPhysicalView`记录物理top／bottom的选择、来源身份及`dsn`信息，包括`method=native-dsn-outer-shape-selection`、`evidence=dsn-export-derived`、导出版本、pin／stack、完整模式和量化信息。`runtimeBBoxModel=dsn-outer-and-runtime-special-union`表示上述SDK全tuple范围模型；原始空网查询失败详情保留在`rawQueryFailure`。几何相关仍不等于唯一源归属。

### 六工程正式检查

用户已导入0.20.112，instanceId为`61dc5f59`。6个工程分别完成首次检查和保存重开检查，共12次正式检查，累计220个检查面；220包含重开重复，不是220个唯一面。每次检查均为制造完整、source/rules稳定、task0。

| 工程 | 首次关联／DSN派生面 | 耗时 | 重开关联／DSN派生面 | 耗时 |
|---|---:|---:|---:|---:|
| original | 10/10／0 | 11,298 ms | 10/10／0 | 14,180 ms |
| rangeinnerA | 20/20／12 | 18,202 ms | 20/20／12 | 16,970 ms |
| rangeinnerB | 20/20／12 | 20,081 ms | 20/20／12 | 18,261 ms |
| overlapfirst | 20/20／0 | 10,800 ms | 20/20／0 | 7,471 ms |
| overlaplast | 20/20／0 | 11,998 ms | 20/20／0 | 13,189 ms |
| dsncomplex | 20/20／12 | 22,246 ms | 20/20／12 | 24,147 ms |

共完成72个DSN派生空网面关联。DSN pattern face checks为circle 36、RECT四角24、OVAL半圆`n13` 12。最终selector replay另外记录横向20、纵向20、quant 15、collision 10，共65项选择；15个精度无法区分的面按设计保留unknown。共享stack本身允许；仅身份缺失、重复、碰撞或精度无法区分时保留unknown。

### 持久性和源模型

六个工程保存关闭重开后，几何模型与制造引用严格一致；每工程49条封装有效记录逐项保持。五个非`dsncomplex`工程的190条设计记录无变化。`dsncomplex`有5项已核实的规范化：4个`PRIMITIVE display:true`字段省略，以及空网默认`NET_LENGTH_TOLERANCE`规则选择器显式化。其余已对照几何与关联保持；不把此结果写成所有源码字节或全部data逐位不变。

原工程最终恢复190条设计、49条封装有效数据、task0。恢复证据为`evidence/v112-final-restoration.json`；持久性明细为`evidence/v112-host-persistence-detail.json`。

### 本地与模型对照

17组回归、57项指令测试、TypeScript检查、构建和expert复审通过；fixture P2已关闭，固定夹具位于仓库内且hash保持。65个DSN shape与111旧正式制造模型对照一致；此比较不单独证明新adapter通过。

包已导入，统一包为6,190,492字节、72文件，SHA256 `87d38869a23ca149884a558acbe264db2416efe428eeb7947b4858fbbe58ea65`。0.20.111归档为历史版本，冻结的112包未重建。`dsnfaces`、`quant`、`collision`三控制各有两次连续原生DSN导出字节稳定且源保持；`faces`和`quant`保存关闭重开后DSN字节稳定，不扩为四控制都完成重开。

B2本轮按R1-R6完成开发与验收。此结论仅覆盖已测工程、DSN结构和用户确认范围；不代表任意输入、完整PAD源枚举、唯一源对象定位或整板生产验收。实例几何／阻焊覆盖源关联限制和文字唯一来源限制按用户已确认决定保留。`wholeBoardProductionAccepted=false`保持。

## 0.20.113集中开发候选（源码与回归已通过，待安装验收）

以下内容保留113安装前候选记录；安装后限定结果见本节末实机验收记录。

### `pcb.checkManufacturingProfile`物理层证据

新增`physicalLayerEvidence`，严格核对有效记录、墓碑、记录身份和重复`zIndex`。返回中保留`rawPhysicalLayerRecords`及`thicknessRaw`。单位不明确时返回unknown；顺序冲突时保留unknown且不生成伪`orderedLayers`。此查询只读，不保存工程。

### SES违规与未知状态

当一次SES检查同时发现确定违规和未知项时，总状态为`violation`，并在写入前拒绝导入。返回仍保留`unknowns`字符串数组与`violations`。只有unknown时，现有导入语义保持不变，也不持续锁定后续导入。

## 0.20.113限定实机验收（2026-10-26）

113已安装。有效物理记录正式读取13层，原始厚度与重复层序保持明确未知。独立工程的circle/RECT分支、已知超宽SES拒绝、随后合法导入及同源DSN/服务/SES显式导入已完成限定验收。新增12线3孔；重开203条记录、完整SES的21线4孔几何保持，目标8对象即时及重开DRC均0。整板仍10项错误，不称通过。混合违规与unknown分支仅本地回归通过，实机受控selector被宿主规范化，未形成该反例。厚度换算、复杂继承及真实生产验收继续待验。

独立工程ACE_B456_V113_ACCEPT_20261026中，分支4个PAD及4条LINE的目标集合明确非空。导入前188条有效数据保持，导入新增12条LINE和3个VIA。原始服务输出与正式取回及保存SES三份均3260字节、逐字节相同。完整SES与重开源码以0.001mil容差逐项对应21条LINE和4个VIA；12mil孔径由调用方明确提供，不是从SES推导。保存重开仅四项类别显示配置省略display:true，视觉等效性未另验。

40mil超出+5V已知25–35mil范围时写前拒绝、有效源记录保持；同一副本紧接着30mil合法请求成功并完成保存重开。ACE_VIA的受控ruleOrder5被宿主恢复为4，因此这份输入不能证明混合unknown实机分支。未连续试探其它值，未扩大复杂继承支持。

冻结官方开发样例正式返回overall=incomplete，单位、真实物理层叠、未验证计算和缺订单未提升为通过。DSN结构默认线宽27.05mil与EDA首选27mil差异仍明确报告，处于22–38mil范围内；各网络有效首选27/30mil匹配，不静默改写。布线服务完成不等于EDA整板连通；整板即时及重开仍有4项线宽与6项连接错误，目标P/N检查0项。

原ACE_B2_ARC_FORMAT_20261023工程恢复后190条有效记录保持、task0，未保存测试修改；本次独立测试服务已退出。113冻结包不重建，安装及持久性结论仅覆盖上述输入。
