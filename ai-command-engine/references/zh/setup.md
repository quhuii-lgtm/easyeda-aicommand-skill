# 连接与环境

## 安装与后台启动

插件 `.eext` 与完整 `ai-command-engine` 技能分别安装。代理随技能提供，无需下载完整插件源码，也无需注册 Windows 启动链接。Node.js 要求 >=20.17.0。

首次使用在技能根目录运行 `npm ci --omit=dev`，安装锁定的代理运行依赖。更新技能后按新锁文件重装依赖；保留用户已有配置。

代理未运行时，由 AI 通过终端工具执行，替换为当前技能的真实路径：

```powershell
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "<技能目录>/scripts/start-proxy.ps1"
```

启动器先检查 `49720–49729` 是否已有兼容代理，再让 Node 隐藏后台绑定一个可用端口。它返回包含实际 `port` 和 `baseUrl` 的 JSON；复用服务时也会返回真实端点。后续 HTTP 请求沿用该 `baseUrl`。

```powershell
$proxy = powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "<技能目录>/scripts/start-proxy.ps1" | ConvertFrom-Json
Invoke-RestMethod "$($proxy.baseUrl)/health"
```

需要固定端口时可传入 `-Port`；指定端口失败后不会切换到其他端口。插件扫描相同范围，并且只连接健康响应包含 `service:"ai-command-proxy"` 和 `lifecycleProtocol:1` 的代理。启动器保留绑定错误的原始信息，包括 `EACCES`／Windows `10013`；不会把所有绑定失败都称为端口占用，也不会结束未知进程。

EDA 插件启用后自动连接代理。代理晚于 EDA 启动时，插件会继续探测并接入。若用户曾在菜单停止桥接，由用户点击“启动桥接”恢复，不绕过暂停。

新启动代理的凭据、日志与备份保存在 `%LOCALAPPDATA%/ai-command-engine`，不写入技能目录，也不随技能更新覆盖。已运行的旧代理继续使用原数据目录，不自动迁移凭据。macOS/Linux 可用 `node scripts/command-proxy.mjs` 配合当地后台启动方式；本轮未验证这两个系统的启动体验。

开发调试连接提示与本指令代理不是同一服务。正常使用不需要无关开发服务器。

## 选择实例与文档

1. 使用启动器返回的 `baseUrl`；也可扫描 `http://127.0.0.1:49720` 至 `http://127.0.0.1:49729`，只选择健康字段包含 `service:"ai-command-proxy"` 和 `lifecycleProtocol:1` 的服务。
2. 请求 `<baseUrl>/connections`，按工程、文档和版本选择实例。不能只看 `selected` 或连接时间。
3. 调用 `project.getInfo` 读取实际工程及文档UUID。需要切页时显式调用 `editor.openDocument`。
4. 每条命令前刷新连接，确认目标仍在线；实例暂停时由使用者在 EDA 菜单恢复，不绕过暂停。

提交到 `POST <baseUrl>/command`，请求头为 `Content-Type: application/json`：

```json
{"instanceId":"<已核实实例>","cmd":"project.getInfo","params":{}}
```

```json
{"instanceId":"<已核实实例>","cmd":"editor.openDocument","params":{"uuid":"<目标文档UUID>"}}
```

`instanceId` 放在请求顶层，不能放进 `params`。离线目标不改投其他窗口。

可选助手 `scripts/eda.py` 会在每次调用前扫描同一端口范围并核对代理身份。只有明确要固定到某个代理时才设置 `AI_COMMAND_PROXY_URL`。每条命令只发往已发现的单个端点；失败后不会改投其他端口重发。

`GET /help?cmd=<命令名>` 使用代理当前选中的实例；先核对其版本。多窗口时可在目标实例调用 `__help`。不要猜测参数或自行拼写 SDK 调用。

## 单位与坐标

| 对象 | 单位与坐标 |
| --- | --- |
| 原理图、符号 | 1单位=10mil，Y向上；按实际显示和捕捉步长操作，不猜默认网格 |
| PCB、封装 | mil，1mm约39.37mil，Y向上 |
| 原理图矩形 | 锚点为左上角，height向下延伸 |
| `pcb.drawOutline` | 对外x/y为左下角 |
| 原理图源码 | 源码Y与API Y符号相反，转换时核对 |

原理图用 `schematic.getPageInfo` 读取实际画布尺寸；PCB读取实际板框。纸张或板框变化以尺寸读回为准。

## 目标检查与任务

`schematic.*` 和 `pcb.*` 可传 `__docUuid`。提供时必须是非空字符串，并与当前焦点页匹配；省略时操作当前已识别页面。目标类型或身份不符会在处理器启动前拒绝，不隐式切页。该检查不保证执行期间页面不会变化。

Registry 指令可选传入 `__projectUuid`，并与 `__docUuid` 和/或 `__tabId` 配合。显式提供工程 UUID 时，必须与当前页的 `parentProjectUuid` 匹配；旧调用可省略该值。这些字段只校验目标，不会切换页面。重连后重新读取实例、工程和文档，再执行 Registry 操作。

`_timeoutMs` 为命令等待预算。非法或超过运行时定时器范围的值会拒绝，低于1秒的值按1秒处理。宏的各步骤分别使用自己的预算。

支持任务登记的命令返回 `taskId`。相同任务仍运行时可能返回 `alreadyRunning:true`；用 `task.get` 查询或补取结果，不改参数盲目重发。已结束的任务不会构成长期写锁。不同版本的去重和路由状态处理以目标插件帮助为准。

## 超时与恢复

- 客户端超时不取消底层操作。先查 `task.list`、`task.get` 和目标内容，再决定下一步。
- 检查 `error.message`、`partial`、失败项及未处理项，不把部分成功当整批完成。
- 写请求按窗口串行执行；支持进度的长命令收到有效进度时会续期。连接ping/pong不代表任务推进。
- 重连、重载或停止再启动后，重新读取实例、工程和文档，不沿用旧身份值；实例ID可能保留，也可能改变。
- 当前请求结果未知时停止依赖步骤；已结束的独立失败不需要手动解锁。
- 使用 0.21.1 扩展时，代理重启后若重连仍在等待，先确认没有在途操作，再保存并重开 EDA 窗口。写入结果未知时不能用重开来清除保护。
- 代理重启后若“停止”或“重连”仍在等待，确认旧连接失效且没有真实在途操作后，客户端按最近一次意图执行；“启动”则沿用当前连接恢复。
- 仍有在途操作或写入结果未知时，先查操作记录和目标状态。保留当前连接与写保护，不自动重发。

## 升级与连接排查

升级前结束已知操作并保存；有未知写入时先核对现场。扩展与代理配套更新后，核对实际进程路径、启动时间和连接版本。

插件健康探测范围为 `49720–49729`。本机转发层可能把连接失败包装成HTTP 500；只有服务身份匹配才会连接。技能启动器也会先检查同一范围，再决定是否启动代理。模块库指令还要求健康响应包含 `moduleLibraryProtocol:1`；旧代理会被跳过，但不会被停止。要使用合并后的模块功能，应同时更新配套技能和扩展。这检查的是代理在健康响应中声明的能力，不是 EDA 或工程文件版本限制。后续请求使用启动器返回的 `baseUrl`。

后台计时可能降频，不能仅据计时延迟认定断线。只有确认没有在途任务并完成连接探测后，才处理旧连接或退出旧进程。
