# AI Command Engine 技能

本仓库独立分发供 AI 工具加载的 `ai-command-engine` 技能，包含技能说明、配套参考、Python 助手及其测试。不包含 EasyEDA 插件运行时、桥接源码或 Node.js 依赖。

技能文档版本为 **2026.10.28**，与插件版本独立。插件仓库是 [quhuii-lgtm/easyeda-aicommand](https://github.com/quhuii-lgtm/easyeda-aicommand)，当前已公开插件版本为 **0.20.50**。本技能文档包含 v0.20.123 的验收记录和 v0.20.124 的本地准备状态。v0.20.124 尚未公开发布，本次文档同步不代表插件新增能力。

## 安装

待发布后，可从 [v2026.10.28 技能发布页](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.10.28)下载；也可以克隆或下载本仓库源码。将完整的 `ai-command-engine` 目录复制到 AI 工具使用的技能目录，必要时重启或重新加载工具。请保留 `SKILL.md`、`SKILL_ZH.md`、`references/`、`scripts/` 和 `tests/` 的相对位置。`SKILL.md` 是英文入口，`SKILL_ZH.md` 和 `references/zh/` 提供中文说明。

安装技能不需要 Node.js 或插件源码，除非要通过插件连接 EasyEDA。连接时请按原插件仓库的环境指南安装；Node.js 需要至少 20.17，并需要完整插件源码及依赖。只复制桥接脚本不足以完成连接。

首次使用时先进行只读环境检查。可以提示 AI：

> 请先阅读 `ai-command-engine` 技能，再查阅 `quhuii-lgtm/easyeda-aicommand` 中的本地插件环境指南，报告环境是否就绪。不要修改任何 EasyEDA 文档。

技能本身不授予修改图纸的权限。任何图纸修改都需要单独授权并指定目标实例；执行命令前，必须依据目标实例的 `help` 输出确认参数。

## 文件

- [`ai-command-engine/SKILL.md`](ai-command-engine/SKILL.md)：英文技能入口。
- [`ai-command-engine/SKILL_ZH.md`](ai-command-engine/SKILL_ZH.md)：中文技能说明。
- [`ai-command-engine/references/`](ai-command-engine/references/)：按任务使用的说明，包括环境设置和命令详情。
- [`ai-command-engine/scripts/eda.py`](ai-command-engine/scripts/eda.py)：可选 Python 助手。
- [`ai-command-engine/tests/`](ai-command-engine/tests/)：助手测试。
- [`ai-command-engine/VERSION`](ai-command-engine/VERSION)：技能文档版本。
- [`CHANGELOG.md`](CHANGELOG.md)：简要记录技能文档变更的英文版本。
- [`CHANGELOG_ZH.md`](CHANGELOG_ZH.md)：技能文档变更记录。

## 发布和验证状态

v2026.10.28 链接是计划使用的技能发布地址；需先创建发布后才能下载。仓库或发布页公开，不代表 AI 工具已安装或加载技能。请在目标 AI 工具中单独检查安装状态。

插件源码、插件发布包和完整插件历史记录仍在 [quhuii-lgtm/easyeda-aicommand](https://github.com/quhuii-lgtm/easyeda-aicommand)。本仓库只记录技能文档维护和仓库拆分。
