# 模块复用

提取可复用设计、恢复已保存模块、组合 PCB 或替换器件时使用本指南。可打开扩展中的“模块复用”菜单操作，也可通过代理发送 `module.*` 指令。使用前先在目标 EDA 窗口查询对应 `__help`；参数、默认值和返回字段以实际帮助为准。

## 操作顺序

1. 确认来源工程、选中对象、目标工程和复用范围。提取设计前调用 `module.captureExtractionSource`。
2. 调用 `module.extractModuleArchive` 提取，并填写 `workcard.newModule.localId`、`workcard.newModule.version` 和所需名称。提取成功后会自动保存到模块库。可选的 `libraryDirectory` 只覆盖本次提取的保存目录。若保存失败，保留提取结果，只重试 `module.librarySave`，不要重复设计操作。
3. 用 `module.libraryList` 或 `module.librarySearch` 查找模块，用 `module.libraryGet` 查看，再用 `module.restoreFile` 恢复源文件。
4. 复用原理图时，调用 `module.placeSchematicPage` 放置图页；需要时调用 `module.alignTemplatePcb` 对齐 PCB 模板；然后用 `module.mapInstanceNets` 映射网络。读回器件实例和网表。重复业务指令若返回 `unknown`、`partial` 或 `pending-verification`，按失败处理；先用对应的 `module.get*Operation` 查询原记录，再决定下一步。
5. 组合 PCB 时，先调用 `module.preparePcbComposition`，再调用 `module.composePcbInstance`。结果不确定时先查 `module.getPcbCompositionOperation`，再决定下一步。
6. 替换器件前，确认候选器件、封装和引脚映射。取得用户同意后，调用 `module.prepareReplacement` 和 `module.executeReplacement`。结果不确定或超时时，先查询 `module.getReplacementOperation`，不要盲目重试。超时会停止后续换件写入，但无法撤回已经发送给 EDA 的操作。
   局部走线必须在实际铜层上与锚点和目标焊盘形成可证明的铜接触。换件流程不会自动添加转层过孔；无法证明接触时应停止并报告失败。
7. 核对有效器件关联、器件身份和逐脚网络。关联须同时通过实际工程资源和最终正式网表确认。保存、关闭、重开并读回每份修改过的文档后，再报告持久性。

## 模块库存放位置

- 用户明确设置的目录优先，并用于后续模块库操作。
- 用户未设置目录时，默认使用实际嘉立创 EDA 安装目录下的 `module-library`。该目录不是 EDA 文档目录。
- 无法可靠确定安装目录或目标目录不可写时，请用户选择一个可写的绝对路径。不要静默切换目录，也不要请求提权。
- `module.setLibraryDirectory` 会改变后续库操作使用的目录，不会搬动现有文件，也不会覆盖旧版本。原模块文件保留；用户可将目录重新指向现有模块库。
- 切换目录不会迁移独立模块复用扩展保存的操作状态。使用合并扩展前，先结束旧扩展的在途任务并停止旧桥接；不要自动卸载旧扩展。

## 范围与限制

合并扩展使用 ACE 代理和 `module.*` 指令，不启动或注册独立模块复用 Gateway/RPC。合并不增加覆铜、挖空或自定义开窗能力；在功能支持时将它们作为独立 PCB 收尾工作处理。

本次电阻样本中，通过官方“Existing Project”模式导入后，资源 UUID 被重建。首次导出发生在打开或保存图页之前，缺少 `DEVICE`、`SYMBOL`、`FOOTPRINT` 的 `META.tags`；同一样本通过“New Project”模式导入则保留这些标签。这些资源分类标签不同于模块库搜索用的 `tags`，也不代表电气连接发生变化。

从“关于插件”确认已安装扩展版本，并在目标窗口查询 `__help`，确认可用的模块指令和参数。本地源码不能证明已安装扩展支持该指令。模块业务验收仍在进行。
