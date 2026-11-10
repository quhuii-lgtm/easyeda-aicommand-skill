# 器件库指令

操作顺序：查询器件和来源库 → 核对符号、封装及模型 → 按需要新建、复制或修改 → 按 UUID 读回确认。只选料时停在查询与核对。

`lib.*` 用于查询和维护符号、封装、器件库资源；普通放置优先使用 `library.searchDevice`、`library.getDeviceByLcsc` 或 `schematic.placeDevice`。参数和返回以当前目标窗口 `/help?cmd=<命令名>` 为准。每条 `/command` 带当前核实的 `instanceId`。

## 查询与选料

- `library.searchDevice` 按关键词找器件，使用 `library.getDeviceByLcsc` 查商城编号。
- `lib.symbolSearch`、`lib.footprintSearch`、`lib.deviceSearch` 查询资源。核对实际命中的库。
- `lib.deviceGetByLcscIds` 按商城编号查库器件。查找范围与原理图放置可能不同；限定来源时核对库和器件 UUID。私有化部署不可用。
- `lib.symbolGet`、`lib.footprintGet`、`lib.deviceGet` 按 UUID 读资源；`lib.footprintGetSource` 读取封装源码，核对源码身份与来源库。

## 创建和复制资源

- `lib.symbolCreate`、`lib.footprintCreate` 创建空白资源；常见的 `key`、名称和分类字段以当前帮助为准。编辑内容后用对应 `symbolUpdateSource` 或 `footprintUpdateSource` 写回源码。写回前保留原始内容并确认目标库、资源身份。
- `lib.deviceCreate` 创建器件。先核对各资源及所属库，创建后按返回 UUID 读回符号、封装和模型关联。结果不明时先查库。
- `lib.symbolCopy`、`lib.footprintCopy`、`lib.deviceCopy` 复制资源。先核对源资源和目标库，再读回新资源。

## 修改与删除

- `lib.symbolModify`、`lib.footprintModify`、`lib.deviceModify` 修改资源。确认目标库，仅提交本次变更。
- SDK 修改后 UUID 可能变化。返回字段 `uuid` 是读回确认的 UUID（若能确认）；`uuidChanged` 表示变化；`verify:"get"` 或 `"search"` 表示对应读回路径确认，`verify:"none"` 表示无法读回确认。出现 partial/`retryable:false` 时不要补写或自动重试。
- `lib.symbolDelete`、`footprintDelete`、`deviceDelete` 按资源 UUID 删除；删除前核对 UUID 和库，之后重新搜索或读源码确认。结果未知时停止后续依赖写入。

## 在编辑器中查看和编辑

- `lib.symbolOpenInEditor`、`lib.footprintOpenInEditor` 打开资源。确认有效页签后再读取文档。
- 编辑器打开后使用 `project.getDocumentSource` 读取当前激活文档源码，先核对文档 UUID，再编辑或保存。

器件库修改不是原理图/PCB实例更新。修改封装后应重新核对器件关联、实例引脚与焊盘编号；器件有封装资源也不单独证明已成功转入 PCB。
