# 连接与环境

## 安装与启动

扩展包、指令代理和技能是三个独立部分。核对它们的版本，不把替换磁盘文件当成运行实例已升级。

首次安装可从[项目仓库](https://github.com/quhuii-lgtm/easyeda-aicommand)取得完整源码，在含 `package-lock.json` 的目录运行 `npm ci`，再运行 `node bridge/command-proxy.mjs`。不要只复制代理脚本或使用 `npm ci --omit=dev`。扩展包从[Releases](https://github.com/quhuii-lgtm/easyeda-aicommand/releases)下载，在 EDA 中安装并允许外部交互。Node版本要求以仓库 `package.json` 为准。SMT物料查询由代理本地执行，不要求EDA在线。

服务未运行时，使用配套 `bridge/launch-proxy.bat` 或已注册的 `ai-command-proxy://start`。启动器可能复用兼容进程；不要盲目停止共享代理。开发调试连接提示与本指令代理不是同一服务，正常安装包不需要启动无关开发服务器。

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
