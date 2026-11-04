# AI Command Engine 技能

[English](README.md)

本仓库分发 `ai-command-engine` 技能和配套本地代理。技能版本为 **2026.11.03**，独立于 EDA 插件版本。本轮配套插件为 0.20.127 候选；发布状态以各自发布页为准。

## 安装与使用

1. 从[技能 2026.11.03 发布页](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.11.03)下载[中英双语 ZIP](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/download/v2026.11.03/ai-command-engine-skill_v2026.11.03_en-zh.zip)，将完整 `ai-command-engine/` 安装到 AI 工具的技能目录。保留入口、`references/`、`scripts/`、`package.json`、`package-lock.json`、`VERSION` 和 `LICENSE`。
2. 使用 Node.js >=20.17.0，在技能根目录运行 `npm ci --omit=dev`。无需下载或构建完整插件源码。
3. 让 AI 阅读技能并按[连接说明](ai-command-engine/references/zh/setup.md)运行 `scripts/start-proxy.ps1`，在 Windows 隐藏后台启动代理。
4. 在 EDA 安装配套 `.eext` 并允许外部交互。插件自动连接；代理未运行时不会自动打开系统链接。检查连接并做只读 `project.getInfo`，再进行已授权操作。

代理数据保存在技能目录外。更新技能不覆盖凭据与备份；已有兼容代理继续使用原数据目录，不强行重启。Node运行依赖首次安装需要联网，正常绘图不要求SMT密钥。

## 文件

- [SKILL.md](ai-command-engine/SKILL.md)：英文入口；[SKILL_ZH.md](ai-command-engine/SKILL_ZH.md)：中文入口。
- [references/](ai-command-engine/references/)：连接、绘图顺序、命令与验收要求。
- [scripts/](ai-command-engine/scripts/)：代理、后台启动器和可选 Python 助手。
- [package.json](ai-command-engine/package.json)与锁文件：最小代理运行依赖。

开发测试与发布历史留在安装目录外。技能包排除运行日志、备份、凭据及 `node_modules`。插件 `.eext` 在[插件仓库](https://github.com/quhuii-lgtm/easyeda-aicommand)独立发布。安装技能不授权修改工程；目标实例、操作与验收按用户任务确定。
