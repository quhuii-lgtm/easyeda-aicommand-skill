---
name: ai-command-engine
description: 通过本地 HTTP 指令查询、绘制、修改和检查嘉立创 EDA 专业版的原理图、PCB、工程与物料库。插件开发和调试另用 extension-dev-skill。
---

# AI Command Engine

通过本机指令代理操作嘉立创 EDA 专业版。发送结构化命令，不临时编写 `eda.*` 脚本。

## 原理图绘制必须执行

首次原理图写入前，按下列顺序读完四份阶段指南，再执行本轮涉及的步骤。

1. [功能区规划与绘制](references/zh/schematic-01-functional-areas.md)
2. [器件放置与布局](references/zh/schematic-02-component-layout.md)
3. [接线与逐区检查](references/zh/schematic-03-wiring-and-area-checks.md)
4. [整页验收与交付](references/zh/schematic-04-acceptance-and-delivery.md)

- 按“画功能框和标题 → 布置器件并读真实引脚 → 逐区接线 → 每区完成后运行脚本验收 → 每页完成后再次运行脚本并整页复验”执行。
- 技能自带 [check-schematic.mjs](scripts/check-schematic.mjs)，用于逐功能区验收和整页复验。 见[可运行示例](references/zh/schematic-03-wiring-and-area-checks.md#可运行示例与结果判读)。
- 新绘功能区必须实际画框和标题；已有图纸只在授权范围内补画或调整。
- 区内相近同网引脚按要求就近直连，包括 GND；不能为省事全部改成标签。
- 按[原理图完成检查](references/zh/schematic-04-acceptance-and-delivery.md#原理图完成检查)逐项验收并报告依据；电气与图面分别判断，整图交付保存重开读回，未检查项不能报通过。

## PCB操作必须执行

首次 PCB 写入前，按顺序读完以下指南，再执行本轮涉及的步骤。

1. [读板与设计规则](references/zh/pcb-01-read-board-and-rules.md)
2. [器件分组与布局](references/zh/pcb-02-group-and-place.md)
3. [手动布线与调谐](references/zh/pcb-03-route-and-tune.md)
4. [自动布线与SES导入](references/zh/pcb-04-autoroute-and-import.md)
5. [覆铜与丝印](references/zh/pcb-05-copper-and-silkscreen.md)
6. [检查与保存](references/zh/pcb-06-verify-and-save.md)

- 按“现状与设计条件 → 机械/层叠/规则 → 真实焊盘布局 → 可布线检查 → 关键及普通布线 → 实际覆铜和丝印 → DRC及适用制造检查 → 保存交付”执行。
- 布局跟随真实焊盘、关键回路和返回路径；宏默认摆放不等于布局合格。
- 分组、自动布线等按[可选功能与提示时机](references/zh/pcb-01-read-board-and-rules.md#可选功能与提示时机)在条件具备时提出并询问，选用后执行；已有明确选择直接沿用，不反复确认。
- 按[PCB完成检查](references/zh/pcb-06-verify-and-save.md#完成检查)逐项报告方法、结论、依据和缺项；DRC为0、覆铜边框或布线服务完成都不能代替整板验收。
- 局部任务只改授权范围，不强制推进整板制造交付，也不把未检查项目报通过。

## 开始操作

1. 按[连接与环境](references/zh/setup.md)检查服务。代理未运行时，Windows 使用技能自带的 `scripts/start-proxy.ps1` 在后台启动，并使用返回的 `baseUrl` 查询实例和当前工程。代理默认选择 `49720–49729` 中的可用端口，插件会自动发现兼容服务。
2. 用索引选择命令，再向目标窗口查询 `__help`。参数、默认值、返回字段和示例以实际帮助为准。请求格式见[连接与环境](references/zh/setup.md)。
3. 绘制或修改前，读取对应操作要求和流程；只查询现状时不必通读绘制资料。

## 执行要求

- 每条请求明确指定 `instanceId`，核对工程和目标文档。同一文档只由一个执行者写入。
- `__docUuid` 是可选的目标页检查，不会自动切换页面。目标页未激活时先打开它。
- 写入后按返回的对象与属性核对结果。需要确认持久性时，保存、关闭重开并读回。
- 超时不表示 SDK 已取消。结果未知时停止依赖操作，先查任务和实际内容，不盲目重发。
- 只读报告中的 `unknown`、`incomplete`、未覆盖对象和候选不能当作检查通过。
- DRC、几何读回和制造参数核对分别判断；命令成功不等于整板或生产合格。
- 安装版本、接口能力和已知问题以当前连接及对应帮助为准，不把本机源码当作已安装能力。

## 按任务查阅

| 任务 | 直接打开 |
| --- | --- |
| 连接、选择窗口、单位、超时恢复 | [连接与环境](references/zh/setup.md) |
| 查找指令分类 | [指令分类](references/zh/commands-frequency.md) |
| 原理图绘制与修改 | 按上方四阶段指南执行，命令索引在各阶段内。 |
| PCB 绘制与修改 | 按上方六阶段指南执行，命令索引在各阶段内。 |
| 工程、板子、图页管理和备份 | [工程与图页指令](references/zh/commands-project.md) |
| 查询或维护符号、封装和器件 | [器件库指令](references/zh/commands-lib.md) |
| 规则知识、线宽估算和物料查询 | [知识与物料指令](references/zh/commands-knowledge.md) |
| 制造文件、BOM和坐标文件 | [生产文件操作要求](references/zh/manufacturing-file-requirements.md) |
| 属性、标签、网表、保存异常 | [问题排查](references/zh/pitfalls.md) |
| 收集和提交插件问题 | [问题上报](references/zh/issue-reporting.md) |
| 开发或审查插件命令 | [插件开发要求](references/zh/extension-development-requirements.md)；SDK资料和调试使用 extension-dev-skill |
