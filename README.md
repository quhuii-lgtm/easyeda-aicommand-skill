# AI Command Engine skill

[简体中文](README_ZH.md)

This repository distributes the `ai-command-engine` skill and its local command proxy. The skill release is **2026.11.11**, independent of EDA extension versions. It accompanies plugin **v0.20.135**. Windows host acceptance on JLCEDA Pro 4.1.93 covered proxy startup, port discovery, automatic connection, SMT entry, and read-only queries; Linux host behavior is untested.

The bilingual guides cover A4 preplanning, the 40-grid default for direct branches and approved exceptions, bends and route candidates, cross-page connections, component replacements, and TEXT verification after reopening.

## Install and use

1. Download the [English/Chinese skill ZIP v2026.11.11](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/download/v2026.11.11/ai-command-engine-skill_v2026.11.11_en-zh.zip) from the [release page](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.11.11). Install the complete `ai-command-engine/` folder in your AI tool's skills directory. Preserve the entry points, `references/`, `scripts/`, package files, `VERSION`, and `LICENSE`.
2. Use Node.js >=20.17.0 and run `npm ci --omit=dev` in the skill root. The complete plugin source and plugin build dependencies are not required.
3. Ask the AI to read the skill and follow [Connection and Environment](ai-command-engine/references/setup.md), running `scripts/start-proxy.ps1` to start the proxy hidden on Windows.
4. Install the companion `.eext` v0.20.135 in EDA and allow external interaction. The plugin discovers a compatible proxy automatically. Verify the intended connection with read-only `project.getInfo` before editing.

Version 2026.11.11 selects an available proxy port from `49720–49729`; the extension discovers a compatible proxy in that range. The Windows launcher returns its actual `baseUrl`. Explicit port selection remains pinned to that port.

Proxy user data stays outside the skill folder. Updating the skill does not overwrite credentials or backups. A compatible running proxy is reused with its existing data directory, without a forced restart. Installing the runtime dependency initially requires network access; ordinary drawing does not require SMT credentials.

## Files

- [SKILL.md](ai-command-engine/SKILL.md): English entry point; [SKILL_ZH.md](ai-command-engine/SKILL_ZH.md): Chinese entry point.
- [references/](ai-command-engine/references/): connection, drawing workflows, command details, and acceptance requirements.
- [scripts/](ai-command-engine/scripts/): command proxy, background launcher, and optional Python helper.
- [package.json](ai-command-engine/package.json) and lockfile: minimal proxy runtime dependency.

Tests and release history stay outside the installable folder. Packages exclude runtime logs, backups, credentials, and `node_modules`. The EDA `.eext` is released separately in the [plugin repository](https://github.com/quhuii-lgtm/easyeda-aicommand). Installing the skill does not authorize document edits; select the target and scope from the user's task.
