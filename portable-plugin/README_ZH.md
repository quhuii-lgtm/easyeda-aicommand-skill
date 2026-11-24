# AI Command Engine 通用配套插件

包含对话规范、防走偏规则、按需多代理分工，以及嘉立创原理图和 PCB 技能、检查脚本、本机代理。通用规则集中维护，各客户端共用。[English](README.md)

- 支持 Agent Plugins 的客户端可安装插件目录。包内也提供 Codex 兼容入口和 Claude Code 插件入口。
- Kimi Code、OpenCode 等支持 Agent Skills 的客户端可用 `skills/` 里的目录。复制完整目录，保留配套脚本和说明。中文绘板入口见 [AI Command Engine 中文技能](skills/ai-command-engine/SKILL_ZH.md)。
- 需要其他任务也采用统一对话方式时，把包内 [AGENTS.md](AGENTS.md) 的内容合并到客户端实际读取的项目或用户指令文件。Claude Code 可合并到 `CLAUDE.md`。保留原配置。绘板时，AI Command Engine 技能会指向包内协作规则。其他任务也可主动调用 `agent-workflow` 技能。

嘉立创 EDA 端继续使用兼容的 `.eext`。绘图和检查需要客户端能在运行 EDA 的电脑上执行脚本和访问本机代理。首次配置见[连接与环境](skills/ai-command-engine/references/zh/setup.md)。AI 按任务和权限自主判断是否用子代理。简单任务、客户端没有代理工具或权限不允许时，主代理直接完成。
