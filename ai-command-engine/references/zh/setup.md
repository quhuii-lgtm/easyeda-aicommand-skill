# 连接、路由、坐标与激活

## 0.20.124 的任务去重修正（2026-10-28，待安装验收）

相同运行中任务仍复用现有进度。0.20.124保留数组顺序，对象字段顺序仍归一；反向引脚和不同坐标顺序不会被误判为相同任务。删除命令在调用处排序ID，继续按同一组对象去重。完成／失败后的任务不阻挡新请求。此修正已纳入0.20.124交付包，尚未进入当前安装的123包。

## 1. 健康检查与启动

首次安装：从 [GitHub 仓库](https://github.com/quhuii-lgtm/easyeda-aicommand) 下载完整源码 ZIP 或克隆仓库，在包含 `package-lock.json` 的目录运行 `npm ci`，然后运行 `node bridge/command-proxy.mjs`。

代理要求 Node.js >=20.17.0（含 npm），并需要依赖 `ws`；版本以仓库 `package.json` 为准。

`.eext` 从 [GitHub Releases](https://github.com/quhuii-lgtm/easyeda-aicommand/releases) 下载。扩展包、代理源码和 AI 技能是独立部分，升级时分别核对版本。

不要只复制单个代理脚本，也不要使用 `npm ci --omit=dev`。

默认地址为 `http://127.0.0.1:49720`。本技能可独立安装，不依赖作者本机的其他技能或调试网关。

EDA 中须启用扩展并允许外部交互，配套指令代理须运行。SMT 物料查询由代理本地执行，不要求 EDA 在线。

发往 EDA 的命令先查询 `GET /connections`，核对实例与工程。每条请求顶层带 `cmd`、`instanceId` 和可选 `params`；`/select` 不能代替请求路由。同一窗口只由一个写入者操作。

用 `project.getInfo` 获取文档 UUID，用 `editor.openDocument` 激活目标。参数以所选窗口对应版本的 `GET /help?cmd=<命令名>` 为准；不猜参数或自行编写 `eda.*`。

实例显示 `paused:true` 时，由使用者在 EDA 菜单恢复连接，不自行绕过暂停。

下面 curl 示例使用 Bash 语法。

Windows PowerShell 用户使用 `Invoke-RestMethod`，完整步骤在仓库安装指南。

```bash
curl http://127.0.0.1:49720/health
curl http://127.0.0.1:49720/connections
```

### 1a. 代理未运行

连接拒绝时，在已安装依赖的仓库目录启动 `node bridge/command-proxy.mjs`，或 Windows 的 `bridge/launch-proxy.bat`。

保留进程并核对健康响应。

默认手动启动。

仓库提供 `bridge/install-url-scheme.ps1` 与 `bridge/uninstall-url-scheme.ps1` 注册/注销 `ai-command-proxy://` 协议。

自动启动入口为 `ai-command-proxy://start`。

注册只提供启动入口，不代表代理已经启动。

启动仍依赖已安装依赖及明确启动动作，不能把等待自动恢复当成首次安装步骤。

所有实例断开后代理默认 300 秒退出。

`PROXY_IDLE_MS=0` 可用于需要常驻的本机配置。

启动器须检查健康响应中的 `ok`、`service` 与 `lifecycleProtocol=1`。

旧版或其他服务应拒绝，不自动停止或重启现有服务。

重连后重新查询实例，不猜测 ID 是否改变。

普通用户保持默认 49720。

只设代理 `PORT` 不会同步修改插件、启动器和 Python 助手的目标地址。

### 1b. 有代理但无实例

确认 EDA 已打开工程，插件已启用且允许外部交互。

需要时点击 AI Command → 连接指令代理。

若用户曾点击断开菜单暂停该实例，必须由用户点击连接恢复，AI 不绕过暂停。

## 2. 核对窗口

`GET /connections` 返回实例、版本、工程信息与暂停状态。

按用户指定工程核对目标。

工程名或身份仍有歧义时先澄清，不自动选最新版本、最新连接或第一项。

每个完整 `/command` 请求都带顶层 `instanceId`，单窗口也一样。

`POST /select` 是全局选择，不替代请求级路由。

`/help` 等发现接口使用全局所选实例，其能力未必等于你的目标版本，核对版本后再使用。

同一窗口焦点共享。

不同 AI 不并发修改同一个窗口。

重装、重连或离线后重新查询并核对目标，未知实例不会改投其他窗口。

## 4. 查询指令能力

```bash
curl 'http://127.0.0.1:49720/help?cmd=schematic.placeDevice'
curl http://127.0.0.1:49720/help
```

参数拿不准先查目标版本手册和在线帮助，不猜参数。

分类指令表主要描述 `params`，不是省略实例 ID 的许可。

## 6. 坐标与单位（⚠️ 极易混淆）

| 画布 | 单位 | Y 轴 | 有效范围 |
| --- | --- | --- | --- |
| 原理图/符号 | **10mil**（1 单位 = 10mil） | +Y 向上 | 先查图框：A4 约 1170×825 单位，建议留 50 边距 |
| PCB/封装 | **mil**（1mm ≈ 39.37mil） | +Y 向上 | 以板框为准 |

- ⚠️ 两者相差 10 倍，混用会把图元放到十万八千里外。
- 原理图网格吸附按当前图页设置。
- 坐标单位为10mil，不把固定5或10倍数作为指令限制。
- 格点是否合规由当前DRC规则判断。
- **图纸尺寸查询**：原理图用 `schematic.getPageInfo`（返回 titleBlock 的 `width`/`height`，单位 10mil。
- A4 = 1170×825，A3 = 1630×1150 左右，以实际读取为准）。
- PCB 板框尺寸用 `pcb.getPrimitivesInRegion` 扫全板找 Region 图元换算，或截图比对。
- 图框尺寸不是定值：先 `schematic.getPageInfo` 读 `width`/`height` 再放器件。
- 原理图坐标的正Y方向向上。
- 矩形锚点是左上角(minX,maxY)。
- 传入的y表示矩形上沿。
- height沿Y减小方向延伸。
- 做布局换算时不要把屏幕坐标（向下为正）直接当世界坐标用。
- `listRects`/`checkRectOverlap`（0.9.4 起）返回归一化 `span:{x1,y1,x2,y2}`，一律用 span 计算。
- **图纸/图框切换（0.9.4 起明确）**：`project.modifyTitleBlock` 只能改当前图框**已存在**的字段（先 `schematic.getPageInfo` 看 titleBlockData 有哪些键）。
- 传不存在的键官方抛 TypeError。
- Page Size和Symbol不能通过该接口切换纸张。
- 用户须在EDA界面修改纸张。
- 修改后用`getPageInfo`的width和height核对尺寸。
- size或Symbol可能仍显示旧文本。
- 层：`"top"` / `"bottom"`。

## 7. 文档激活（⚠️ 0.8.2 起有类型守卫）

任何 `schematic.*` / `pcb.*` 指令前，必须先激活对应类型文档：

```json
{ "cmd": "editor.openDocument", "instanceId": "<已核对的实例ID>", "params": { "uuid": "<图页或PCB的uuid>" } }
```

- 原理图页 uuid 从 `project.listSchematicPages` 获取，其他文档从 `project.getInfo` 的文档树核对。
- 激活后在页级指令中携带 `params.__docUuid` 核对，不能只检查类型。
- ⚠️ 焦点不对时指令会明确报错（这是守卫，不是 bug），重新 openDocument 即可。

## 3. 发送完整请求

将占位符替换为刚核对的实例 ID：

```bash
curl -X POST http://127.0.0.1:49720/command -H 'Content-Type: application/json' -d '{"cmd":"project.getInfo","instanceId":"<已核对的实例ID>","params":{}}'
```

顶层是 `cmd`、`instanceId`、可选 `params`。

当前代理对发往 EDA 的缺 ID 请求直接拒绝，不会落到全局选中实例。

成功返回 `ok:true`。

失败可能为 HTTP 错误，也可能 HTTP 200 但 `ok:false`，必须检查返回体。

遇到 `UNKNOWN_INSTANCE` / `TARGET_OFFLINE`，重新查询连接并核对身份。

不要通过重选别的工程来消除报错。

宏仅在外层带 `instanceId`，`params.steps` 中的子命令继承同一实例，不各自路由。

## 8. 其他编辑器操作

| 指令 | 作用 | 使用时机 | 用法 | 限制 |
| --- | --- | --- | --- | --- |
| `editor.listTabs` | 列出当前窗口页签。 | 选择或确认文档页签时。 | 无 | 页签ID应从本窗口实际返回取得。 |
| `editor.screenshot` | 截取当前编辑器视口。 | 需要查看当前画布外观时。 | `zoomToAll?`, `tabId?` | 后台窗口可能返回旧缓存帧。 |
| `schematic.exportPng` | **视觉验收首选**（独立渲染管线，窗口后台也出全图。<br>返回**全部原理图页打包成 ZIP** 的 base64——PK 开头，先解 ZIP 再读每页 PNG） | 备份、交付或独立检查时使用。 | 无 | 单边尺寸不超过4096px。 |
| `editor.zoomToAll` | 缩放至全部图元。 | 需要查看整体布局时。 | `tabId?` | 缩放成功不证明后台画布已重绘。 |
| `editor.zoomToRegion` | 缩放至指定区域。 | 需要查看局部内容时。 | `left/right/top/bottom`, `tabId?` | 坐标单位取决于当前文档。 |
| `editor.closeDocument` | 关闭指定页签并检查结果。 | 已完成保存且需要关闭页面时。 | `uuid?`, `tabId?` | 未知页签状态不能当作已关闭。 |

- **区域截图**（无原生指令，两步 macro 等效）：`zoomToRegion` 对准区域 → `screenshot` 截视口。

```json
{
	"cmd": "macro",
	"instanceId": "<已核对的实例ID>",
	"params": {
		"steps": [
			{ "cmd": "editor.zoomToRegion", "params": { "left": 100, "right": 200, "top": 200, "bottom": 100 } },
			{ "cmd": "editor.screenshot", "params": {} }
		]
	}
}
```

100和200是演示坐标。
使用前替换为目标区域。

left<right、top>bottom，Y 向上取大值。

截图结果在macro返回的steps[1].base64中。

## 5. 超时、进度与后续请求

v0.20.57及配套代理不再因历史partial、超时或恢复失败持续锁住窗口。后续独立请求无需手动解锁。

请求仍按窗口FIFO执行；当前请求返回结果或既有超时响应后，队列继续。读请求可并发。超时不代表宿主后台调用已取消，后续操作应根据实际现场决定，不自动重发原请求。

默认等待300秒，进度心跳可延长等待。有taskId时可用task.get查询；普通写不一定登记任务表，空表不能证明底层调用已结束。

当前宏遇partial仍停止依赖步骤；活跃任务的同参数去重仍保留。它们不构成失败结束后的全局锁。

write.acknowledge仅保留兼容成功回执，不清除队列、不取消任务，也不证明旧写成功。正常使用不需要调用。

editor.openDocument/closeDocument也按写请求排队。日志在代理目录lane-log-*.jsonl，排查说明见[pitfalls](pitfalls.md)。

## 参数与宏引用

单条指令的 `_timeoutMs` 省略或为 null 时沿用默认预算；数值须可转换为有限毫秒数，且不超过原生定时器支持的 2147483647 ms。低于1000 ms仍按1000 ms处理。非法值在任何文档SDK或处理器启动前拒绝。宏顶层不使用该参数，子步骤分别检查。

自动网名 `$1N1` 及插件计划生成的 `$1N1:1` 分组key按字面值传递。宏引用仍使用 `$步骤ID.字段`；其他以美元符号开头的文字使用 `$$` 转义。

## 冷启动与开发调试连接排查

已安装宿主的 HTTP 转发层可能将 `127.0.0.1` 拒绝连接包装成 HTTP 500 JSON，导致扩展把未运行的桥接当成不兼容服务、跳过启动。

扩展内部健康探测使用`http://localhost:49720/health`。
该地址用于宿主直接请求路径。

WebSocket、监听地址和 Windows 启动器不变。

真实异服务/旧服务仍拒绝，不因 HTTP 500 盲目新起进程。

当前宿主的完整冷启动须单独验证。
手动启动成功不能证明冷启动通过。

若提示“WebSocket 调试模式连接重试已达最大次数”或要求 `npm run dev`，这是宿主扩展开发调试连接，与 AI Command 的桥接重连不是同一条链。

正常使用安装包不需要启动开发服务器。

不要靠启动无关调试服务来掩盖桥接故障。

## v0.20.70 页级目标核对

`schematic.*` 与 `pcb.*` 的help列出可选 `__docUuid`。提供时必须是非空、非纯空白字符串；不改变合法输入原值，按当前文档UUID精确核对。省略时允许操作当前已识别的对应类型页面，不要求每条请求强制填写。

当前类型错误、身份缺失、UUID不符或身份读取失败时，处理器不会启动。指令不会隐式激活其他页；先确认目标，再显式调用 `editor.openDocument`。入口读取超时属于前置只读失败，不标记已发生部分写入；它和处理器初始等待共用既有 `_timeoutMs`，原有进度心跳续期保持。

宏的每个页级步骤重新核对目标。入口核对不承诺处理器任意异步等待期间焦点始终不变；多阶段写入仍依靠各命令已有的写前核对。前置错误不会持续锁住后续独立请求。EDA4.1.78安装版已验收六组无效目标、错类型、同类型错UUID、宏切页拒绝及正常读取；原理图和PCB非DOCHEAD记录保持。入口pending/late与预算由本地故障注入覆盖，不称宿主实测。
