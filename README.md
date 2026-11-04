# AI Command Engine skill

[简体中文](README_ZH.md)

This repository distributes the `ai-command-engine` skill and its local command proxy. Skill version **2026.11.03** is independent of the EDA extension version. Its companion in this update is the v0.20.127 candidate; consult each release page for actual publication status.

## Install and use

1. Download the [English/Chinese skill ZIP v2026.11.03](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/download/v2026.11.03/ai-command-engine-skill_v2026.11.03_en-zh.zip) from the [release page](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.11.03). Install the complete `ai-command-engine/` folder in your AI tool's skills directory. Preserve the entry points, `references/`, `scripts/`, `package.json`, `package-lock.json`, `VERSION`, and `LICENSE`.
2. Use Node.js >=20.17.0 and run `npm ci --omit=dev` in the skill root. The complete plugin source and plugin build dependencies are not required.
3. Ask the AI to read the skill and follow [Connection and Environment](ai-command-engine/references/setup.md), running `scripts/start-proxy.ps1` to start the proxy hidden on Windows.
4. Install the companion `.eext` in EDA and allow external interaction. The plugin connects automatically; it does not automatically open a system URL when the proxy is stopped. Verify the connection with a read-only `project.getInfo` call before authorized editing.

Proxy user data stays outside the skill folder. Updating the skill does not overwrite credentials or backups. A compatible running proxy is reused with its existing data directory, without a forced restart. Installing the runtime dependency initially requires network access; ordinary drawing does not require SMT credentials.

## Files

- [SKILL.md](ai-command-engine/SKILL.md): English entry point; [SKILL_ZH.md](ai-command-engine/SKILL_ZH.md): Chinese entry point.
- [references/](ai-command-engine/references/): connection, drawing workflows, command details, and acceptance requirements.
- [scripts/](ai-command-engine/scripts/): command proxy, background launcher, and optional Python helper.
- [package.json](ai-command-engine/package.json) and lockfile: minimal proxy runtime dependency.

Tests and release history stay outside the installable folder. Packages exclude runtime logs, backups, credentials, and `node_modules`. The EDA `.eext` is released separately in the [plugin repository](https://github.com/quhuii-lgtm/easyeda-aicommand). Installing the skill does not authorize document edits; select the target and scope from the user's task.
