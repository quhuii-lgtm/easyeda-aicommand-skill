# 工程与图页指令

参数、返回和示例以已核对目标窗口的 `/help?cmd=<命令名>` 为准。发送 `/command` 时外层包含 `cmd`、当前核实的顶层 `instanceId` 和所需 `params`；宏步骤继承该实例。文档树 UUID 从 `project.getInfo` 读取，不猜。

## 工程

- `project.getInfo` 读取当前工程及文档树 UUID；`project.getInfoOf` 查询指定工程。`project.list` 可选 `teamUuid`（非空字符串，原样传入）和 `detail`（布尔值，默认 `false`）。默认使用宿主查询范围；`detail:true` 返回按序 `{uuid, info}` 数组，否则返回 UUID 数组。空列表表示该查询确为空，不代表先前导入未发生；结果异常时先核对范围及团队。
- `project.create` 创建工程；`project.open` 打开指定工程并切换当前工程。打开前确认旧工程已保存，或用户允许丢弃未保存内容；合法目标也不保证保留旧工程未保存数据。
- `project.moveToFolder` 移动工程，空目录表示根目录；移动前后按工程 UUID 核对位置。
- `project.exportFile` 导出原生 `.epro` 或 `.epro2`，`fileType` 仅接受 `epro`/`epro2`，默认 `epro`。需要工程管理中的“下载工程”权限。导出成功不等于内容已验收。
- `project.importFile` 导入 base64 文件并创建工程。支持的格式包括 `.PcbDoc`、`.SchDoc`、`.epro`、`.epro2`，可由扩展名推断 `fileType`；`newProjectName` 可指定显示名，调用前检查当前团队重名。在线 `.epro2` 省略名称时仅从根 `project2.json.title` 派生；不从文件名猜名、不追加后缀或覆盖同名工程。无法可靠取名或已重名时须显式提供名称。在线 `.epro2` 的根 `description` 会按原字符串写入新工程描述；此规则不适用于离线导入或其他格式。导入 API 为 Beta，不承诺所有格式无损，也不证明已布线 PCB/覆铜持久。
- 导入调用后若返回空、异常或无合法工程 UUID，结果为 `partial:true`、`retryable:false`、`outcome:unknown`。先按目标名称和目录查工程，不重发。成功返回也须检查工程内容。
- `project.getDocumentSource` 只读当前激活文档，不接受 UUID 参数。先确认焦点和文档身份；源码坐标不能直接当公开 API 坐标。
- `project.modifyTitleBlock` 只改现有标题栏字段。先用 `schematic.getPageInfo` 读取 `titleBlockData`；`data` 的键必须已存在，省略字段沿用当前值。`modified:true` 只表示宿主接收提交，不表示保存或读回确认。Page Size 和 Symbol 不能由此接口切换。

## Board 与原理图/PCB 关联

- `project.getBoardInfo` 检查当前 Board 与原理图、PCB 的关联。
- `project.associateBoard` 建立原理图和 PCB 对 Board 的关联；写入结果未知时停止后续依赖写入。
- `project.copyBoard` 复制 Board。`project.deleteBoard` 删除 Board，`project.renameBoard` 按名称匹配并重命名；重名时先用 `getBoardInfo` 确认目标。删除前核对并备份目标。

## 原理图和图页

- `project.createSchematic` 为工程创建原理图；若提供 `boardName`，必须是已有 Board 名。省略时之后用 `associateBoard` 关联。
- `project.createSchematicPage` 在原理图下新建图页，必需的 `schematicUuid` 是父 Schematic UUID，不是图页 UUID。
- `project.listSchematicPages` 列出当前工程的图页及 UUID；文档树 UUID 应从 `project.getInfo` 读取。
- `project.copySchematicPage` 以 `pageUuid` 指定源图页，可选 `schematicUuid` 指定目标父原理图；省略时复制到同一原理图。新页名可能按“源名_N”生成。成功返回新 UUID、名称、父原理图 UUID 和源页 UUID，并读回核对归属。若 SDK 返回空 UUID、源 UUID 或读回异常，错误标为 `partial:true`、`retryable:false`；先查工程树，不重试、不回退、不保存来掩盖未知结果。
- `project.renameSchematicPage` 用 `pageUuid` 和 `name` 按 UUID 改名；插件会打开并激活目标、尝试保存，再读回核对。返回 `renamed:true` 才确认读回已生效；`renamed:false` 且带 `note` 表示宿主接受但读回未生效，应稍后用 `listSchematicPages` 复查。不要把特定旧窗口现象当作所有环境的固定限制。
- `project.reorderSchematicPages` 需要 `schematicUuid` 和按目标顺序排列的完整 `pageUuids`，不可只传要移动的页。
- `project.deleteSchematicPage` 删除已核对的图页；先确认 UUID 并备份，删除后重扫工程树。结果未知时停止后续删除。

## PCB 文档

- `project.createPcb` 新建 PCB；若提供 `boardName`，须是已有 Board 名。
- `project.copyPcb` 必须提供源 `pcbUuid`；可选 `boardName` 指定副本归属的目标 Board 名，省略时创建游离 PCB。目标 Board 必须存在且 PCB 槽为空。成功返回新 `pcbUuid`。SDK 空返回或异常表示结果未知并标记 `partial:true`、`retryable:false`，不要再次复制；先用 `project.getInfo` 和 `project.listPcbs` 核对。
- `project.listPcbs` 列出 PCB；`project.deletePcb` 删除前先核对目标并备份。复制后检查新对象身份和归属；保存重开若发现对象、几何或网络差异，先停止并核实，不手工改 Unique ID 或自动重拷。

工程写入前核对目标类型、当前工程及 Board 槽位。超时不表示已取消已发出的调用；结果未明时不启动依赖写入。复制、删除、移动后从工程树读回确认身份、归属或位置。官方导入接口资料以目标窗口帮助为准；未知结果均先查现场，不自动重试。
