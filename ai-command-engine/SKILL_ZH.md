---
name: ai-command-engine
description: 通过本地 HTTP 指令查询、绘制、修改和检查嘉立创 EDA 专业版的原理图、PCB、工程与物料库。插件开发和调试另用 extension-dev-skill。
---

# AI Command Engine

通过本机指令代理操作嘉立创 EDA 专业版。发送结构化命令，不临时编写 `eda.*` 脚本。

## 原理图绘制必须执行

首次原理图写入前，必须读完[原理图操作要求](references/zh/原理图操作要求.md)和[原理图操作流程](references/zh/commands-schematic.md)，不能只查命令表就开始画。

- 按“画功能框和标题 → 布置器件并读真实引脚 → 逐区接线 → 逐区检查 → 整页核对与保存”执行。
- 新绘功能区必须实际画框和标题；已有图纸只在授权范围内补画或调整。
- 区内相近同网引脚按要求就近直连，包括 GND；不能为省事全部改成标签。
- 按[原理图完成检查](references/zh/原理图操作要求.md#原理图完成检查)逐项验收并报告依据；电气与图面分别判断，整图交付保存重开读回，未检查项不能报通过。

## PCB操作必须执行

首次PCB写入前，必须读完[PCB操作要求](references/zh/PCB操作要求.md)和[PCB操作流程](references/zh/commands-pcb.md)，不能只查命令表就开始。

- 按“现状与设计条件 → 机械/层叠/规则 → 真实焊盘布局 → 可布线检查 → 关键及普通布线 → 实际覆铜和丝印 → DRC及适用制造检查 → 保存交付”执行。
- 布局跟随真实焊盘、关键回路和返回路径；宏默认摆放不等于布局合格。
- 分组、自动布线等按[可选功能与提示时机](references/zh/PCB操作要求.md#可选功能与提示时机)在条件具备时提出并询问，选用后执行；已有明确选择直接沿用，不反复确认。
- 按[PCB完成检查](references/zh/PCB操作要求.md#完成检查)逐项报告方法、结论、依据和缺项；DRC为0、覆铜边框或布线服务完成都不能代替整板验收。
- 局部任务只改授权范围，不强制推进整板制造交付，也不把未检查项目报通过。

## 开始操作

1. 按[连接与环境](references/zh/setup.md)检查服务、实例和当前工程。
2. 查询目标插件版本的命令帮助，使用实际返回的参数。
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
| 原理图绘制与修改 | [原理图操作要求](references/zh/原理图操作要求.md)、[原理图操作流程](references/zh/commands-schematic.md) |
| 原理图命令索引 | [原理图高频指令](references/zh/commands-schematic-high.md)、[原理图低频指令](references/zh/commands-schematic-low.md) |
| PCB布局、布线、覆铜和检查 | [PCB操作要求](references/zh/PCB操作要求.md)、[PCB操作流程](references/zh/commands-pcb.md) |
| PCB命令索引 | [PCB高频指令](references/zh/commands-pcb-high.md)、[PCB低频指令](references/zh/commands-pcb-low.md) |
| 扇出、差分、补长、制造检查和自动布线参数 | [PCB专题](references/zh/commands-pcb-special.md) |
| 工程、板子、图页管理和备份 | [工程与图页指令](references/zh/commands-project.md) |
| 查询或维护符号、封装和器件 | [器件库指令](references/zh/commands-lib.md) |
| 规则知识、线宽估算和物料查询 | [知识与物料指令](references/zh/commands-knowledge.md) |
| 制造文件、BOM和坐标文件 | [生产文件操作要求](references/zh/生产文件操作要求.md) |
| 属性、标签、网表、保存异常 | [问题排查](references/zh/pitfalls.md) |
| 收集和提交插件问题 | [问题上报](references/zh/issue-reporting.md) |
| 开发或审查插件命令 | [插件开发要求](references/zh/插件开发要求.md)；SDK资料和调试使用 extension-dev-skill |
