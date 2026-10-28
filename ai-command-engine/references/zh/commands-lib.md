# 器件库指令

`lib.*` 用于查询和维护符号、封装、器件库资源；普通放置优先使用 `library.searchDevice`、`library.getDeviceByLcsc` 或 `schematic.placeDevice`。参数和返回以当前目标窗口 `/help?cmd=<命令名>` 为准。每条 `/command` 带当前核实的 `instanceId`。

## 查询与选料

- `library.searchDevice` 按 `keyword` 搜索，`limit` 默认 10；返回器件 UUID、库 UUID、名称、商城编号和封装等信息。`library.getDeviceByLcsc` 按 `lcscId` 查一个商城编号，未找到时报错。
- `lib.symbolSearch`、`footprintSearch`、`deviceSearch` 按 `key` 搜索资源，支持 `libraryUuid`、`classification`、`page` 和 `itemsOfPage`。`page` 默认 1，`itemsOfPage` 默认 20，均须为正整数；空关键词列出该库全部结果。查询省略库时默认个人库，不能把搜索结果当作工程实例。
- `lib.deviceGetByLcscIds` 的 `lcscIds` 可为单个编号或数组；`allowMultiMatch` 默认 `false`，可设为 `true` 保留同编号的多个匹配；`diagnostic` 默认 `false`，设为 `true` 时附加单次 SDK 调用诊断。此查询默认个人库，且私有化部署环境不可用；它和 `schematic.placeDevice(lcscId)` 的 SDK 默认查询范围不同。要限定放置来源，应显式传 `libraryUuid`，并核对回包里的请求库、实际选中库及器件 UUID；插件不会自动跨库换同料号器件。
- `lib.symbolGet`、`footprintGet`、`deviceGet` 按 UUID 读完整属性；省略 `libraryUuid` 默认个人库。`lib.footprintGetSource` 省略库时依次查工程库、个人库；显式提供库时只查指定库，不跨库回退。返回源码时核对其 DOCHEAD/HEAD UUID 与请求 UUID。

## 创建和复制资源

- `lib.symbolCreate`、`lib.footprintCreate` 创建空白资源；常见的 `key`、名称和分类字段以当前帮助为准。编辑内容后用对应 `symbolUpdateSource` 或 `footprintUpdateSource` 写回源码。写回前保留原始内容并确认目标库、资源身份。
- `lib.deviceCreate` 以必需的 `name` 和 `symbolUuid` 组装器件，也可传 `symbolType` 创建空白符号；可选关联 `footprintUuid`、`model3DUuid`、分类、描述和属性。主 `libraryUuid` 省略时默认个人库；跨库资源分别用 `symbolLibraryUuid`、`footprintLibraryUuid` 指定，3D 模型用 `model3DLibraryUuid`（默认器件库）。提供 3D 库 UUID 时必须同时提供 3D 模型 UUID；创建前插件会核对模型身份与库。创建后优先按返回 UUID `get` 读回，核对库和符号/封装/模型关联；若 `get` 不可用，按返回 UUID 精确搜索核对，不要再次创建。
- `lib.symbolCopy`、`footprintCopy`、`deviceCopy` 需要源 UUID 和必需的 `targetLibraryUuid`；可选 `targetClassification` 默认空数组、`newName` 指定副本名。返回新资源 UUID。目标库同名可能导致 SDK 拒绝或空返回；确认现场后再决定后续处理。

## 修改与删除

- `lib.symbolModify`、`footprintModify`、`deviceModify` 按 UUID 修改指定资源，可选 `libraryUuid`，省略时默认个人库。仅提交要改的字段；`name` 省略时保留现名；可选属性值设为 `null` 表示清除。器件还可用 `symbolUuid`、`footprintUuid` 改绑，用 `property` 修改 designator、manufacturer、supplier 等属性。
- SDK 修改后 UUID 可能变化。返回字段 `uuid` 是读回确认的 UUID（若能确认）；`uuidChanged` 表示变化；`verify:"get"` 或 `"search"` 表示对应读回路径确认，`verify:"none"` 表示无法读回确认。出现 partial/`retryable:false` 时不要补写或自动重试。
- `lib.symbolDelete`、`footprintDelete`、`deviceDelete` 按资源 UUID 删除；删除前核对 UUID 和库，之后重新搜索或读源码确认。结果未知时停止后续依赖写入。

## 在编辑器中查看和编辑

- `lib.symbolOpenInEditor`、`lib.footprintOpenInEditor` 按资源 UUID 打开编辑器，可选 `libraryUuid`（默认个人库），返回 `tabId`。无有效页签 ID 时视为打开未确认；错误 `[object Object]` 表示宿主错误无法解读，不证明资源不存在。
- 编辑器打开后使用 `project.getDocumentSource` 读取当前激活文档源码，先核对文档 UUID，再编辑或保存。

器件库修改不是原理图/PCB实例更新。修改封装后应重新核对器件关联、实例引脚与焊盘编号；器件有封装资源也不单独证明已成功转入 PCB。
