# AI Command Engine 技能

[English](README.md)

完整中英文技能 2026.11.14.1，配套插件 0.21.7，更新设计规则、DRC、板框缩放、扇出及单 PCB 恢复指南。请安装完整目录，并保留指南中宿主和几何精度的适用条件。

中英文指南涵盖 A4 预排、直连默认 40 格及支路例外审批、折弯和布线候选、跨页连接、替代器件、TEXT 重开复验。

本轮 PCB 指南补充分组恢复未知时的 partial 处理，以及布线启动回包丢失后按原操作 ID、PCB 和 tab 找回任务。

配套技能覆盖模块复用合并与空闲代理异常退出恢复。按模块复用指南及目标实例帮助操作，代理保留外置用户数据目录适配。依赖导入资源分类前，请阅读 Existing Project 的 META.tags 样本限制。

## 安装与使用

1. 从[技能 2026.11.14.1 发布页](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.11.14.1)下载[中英双语 ZIP](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/download/v2026.11.14.1/ai-command-engine-skill_v2026.11.14.1_en-zh.zip)，将完整 `ai-command-engine/` 安装到 AI 工具的技能目录。保留入口、`references/`、`scripts/`、依赖文件、`VERSION` 和 `LICENSE`。
2. 使用 Node.js >=20.17.0，在技能根目录运行 `npm ci --omit=dev`。无需下载或构建完整插件源码。
3. 让 AI 阅读技能并按[连接说明](ai-command-engine/references/zh/setup.md)运行 `scripts/start-proxy.ps1`，在 Windows 隐藏后台启动代理。
4. 从[插件 v0.21.7 发布页](https://github.com/quhuii-lgtm/easyeda-aicommand/releases/tag/v0.21.7)安装配套 `.eext` 并允许外部交互。插件自动发现兼容代理；开始修改前用只读 `project.getInfo` 核对目标连接。

2026.11.14.1 会在 `49720–49729` 中选择可用端口，插件扫描同一范围发现兼容代理。Windows 启动器会返回实际 `baseUrl`；显式指定端口时只使用该端口。

代理数据保存在技能目录外。更新技能不覆盖凭据与备份；已有兼容代理继续使用原数据目录，不强行重启。Node运行依赖首次安装需要联网，正常绘图不要求SMT密钥。

## 文件

- [SKILL.md](ai-command-engine/SKILL.md)：英文入口；[SKILL_ZH.md](ai-command-engine/SKILL_ZH.md)：中文入口。
- [references/](ai-command-engine/references/)：连接、绘图顺序、命令与验收要求。
- [scripts/](ai-command-engine/scripts/)：代理、后台启动器和可选 Python 助手。
- [package.json](ai-command-engine/package.json)与锁文件：最小代理运行依赖。

开发测试与发布历史留在安装目录外。技能包排除运行日志、备份、凭据及 `node_modules`。插件 `.eext` 在[插件仓库](https://github.com/quhuii-lgtm/easyeda-aicommand)独立发布。安装技能不授权修改工程；目标实例、操作与验收按用户任务确定。
