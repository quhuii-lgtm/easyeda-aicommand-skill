# 连接与环境

## 安装与后台启动

插件 `.eext` 与完整 `ai-command-engine` 技能分别安装。代理随技能提供，无需下载完整插件源码，也无需注册 Windows 启动链接。Node.js 要求 >=20.17.0。

首次使用在技能根目录运行 `npm ci --omit=dev`，安装锁定的代理运行依赖。更新技能后按新锁文件重装依赖；保留用户已有配置。

每次操作先检查 `http://127.0.0.1:49720/health`。代理未运行时，由 AI 通过终端工具执行，替换为当前技能的真实路径：

```powershell
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "<技能目录>/scripts/start-proxy.ps1"
```

启动器隐藏后台运行 Node，不打开黑窗或系统启动链接。它检查服务身份并复用已运行的兼容代理。失败返回具体错误；不结束未知进程，也不自动改端口。启动后核对健康响应，再查 EDA 连接。

EDA 插件启用后自动连接代理。代理晚于 EDA 启动时，插件会继续探测并接入。若用户曾在菜单停止桥接，由用户点击“启动桥接”恢复，不绕过暂停。

新启动代理的凭据、日志与备份保存在 `%LOCALAPPDATA%/ai-command-engine`，不写入技能目录，也不随技能更新覆盖。已运行的旧代理继续使用原数据目录，不自动迁移凭据。macOS/Linux 可用 `node scripts/command-proxy.mjs` 配合当地后台启动方式；本轮未验证这两个系统的启动体验。

开发调试连接提示与本指令代理不是同一服务。正常使用不需要无关开发服务器。

## 选择实例与文档

1. 请求 `GET http://localhost:49720/health`，确认 `service:"ai-command-proxy"` 和 `lifecycleProtocol:1`。
2. 请求 `GET /connections`，按工程、文档和版本选择实例。不能只看 `selected` 或连接时间。
3. 调用 `project.getInfo` 读取实际工程及文档UUID。需要切页时显式调用 `editor.openDocument`。
4. 每条命令前刷新连接，确认目标仍在线；实例暂停时由使用者在 EDA 菜单恢复，不绕过暂停。

提交到 `POST http://localhost:49720/command`，请求头为 `Content-Type: application/json`：

```json
{"instanceId":"<已核实实例>","cmd":"project.getInfo","params":{}}
```

```json
{"instanceId":"<已核实实例>","cmd":"editor.openDocument","params":{"uuid":"<目标文档UUID>"}}
```

`instanceId` 放在请求顶层，不能放进 `params`。离线目标不改投其他窗口。

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

`_timeoutMs` 为命令等待预算。非法或超过运行时定时器范围的值会拒绝，低于1秒的值按1秒处理。宏的各步骤分别使用自己的预算。

支持任务登记的命令返回 `taskId`。相同任务仍运行时可能返回 `alreadyRunning:true`；用 `task.get` 查询或补取结果，不改参数盲目重发。已结束的任务不会构成长期写锁。不同版本的去重和路由状态处理以目标插件帮助为准。

## 超时与恢复

- 客户端超时不取消底层操作。先查 `task.list`、`task.get` 和目标内容，再决定下一步。
- 检查 `error.message`、`partial`、失败项及未处理项，不把部分成功当整批完成。
- 写请求按窗口串行执行；支持进度的长命令收到有效进度时会续期。连接ping/pong不代表任务推进。
- 重连、重载或停止再启动后，重新核对实例、工程和文档。实例ID可能保留，也可能改变。
- 当前请求结果未知时停止依赖步骤；已结束的独立失败不需要手动解锁。

## 升级与连接排查

升级前结束已知操作并保存；有未知写入时先核对现场。扩展与代理配套更新后，核对实际进程路径、启动时间和连接版本。

宿主健康探测使用 `http://localhost:49720/health`。本机转发层可能把连接失败包装成HTTP 500；先判断是否真的有兼容服务，不因500盲目再启动进程。

后台计时可能降频，不能仅据计时延迟认定断线。只有确认没有在途任务并完成连接探测后，才处理旧连接或退出旧进程。
