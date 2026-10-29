# AI Command Engine skill

This update makes the schematic and PCB reading order, workflow, acceptance checks, and save/reopen scope explicit. Optional PCB tools are offered when applicable; follow existing choices and wait for a choice before running an unselected tool. Confirmed design requirements and already authorized necessary work still apply.

This repository distributes the standalone `ai-command-engine` skill for AI assistants that can load agent skills. It contains skill instructions, supporting references, and a Python helper. It does not contain the EasyEDA plugin runtime, bridge source, or Node.js dependencies.

The skill documentation version is **2026.10.29**. It is independent of the plugin version. The plugin repository is [quhuii-lgtm/easyeda-aicommand](https://github.com/quhuii-lgtm/easyeda-aicommand); the plugin/source version covered by this skill is [v0.20.126](https://github.com/quhuii-lgtm/easyeda-aicommand/releases/tag/v0.20.126).

## Install

Download `ai-command-engine-skill_v2026.10.29_en-zh.zip` from the [v2026.10.29 skill release](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.10.29), or clone or download this repository's source. Copy the complete `ai-command-engine` directory into the skills directory used by your AI tool, then restart or reload that tool if needed. Keep `SKILL.md`, `SKILL_ZH.md`, `references/`, `scripts/`, `VERSION`, and `LICENSE` together. `SKILL.md` is the English entry point; `SKILL_ZH.md` and `references/zh/` provide Chinese instructions.

Installing the skill does not require Node.js or the plugin source unless you intend to connect to EasyEDA through the plugin. For that connection, follow the [plugin setup guide](https://github.com/quhuii-lgtm/easyeda-aicommand/blob/main/docs/QUICKSTART.md); the required Node.js version is at least 20.17, and the complete plugin source and dependencies are required. Copying only the bridge script is insufficient.

Start with a read-only environment check. Tell your AI assistant:

> Read the `ai-command-engine` skill first. Check the local plugin setup guide in `quhuii-lgtm/easyeda-aicommand` and report whether the environment is ready. Do not change any EasyEDA document.

The skill does not grant permission to modify drawings. Authorize any drawing changes separately and specify the target instance; commands must use the target instance's `help` output to confirm parameters.

## Files

- [`ai-command-engine/SKILL.md`](ai-command-engine/SKILL.md): English skill entry point.
- [`ai-command-engine/SKILL_ZH.md`](ai-command-engine/SKILL_ZH.md): Chinese skill instructions.
- [`ai-command-engine/references/`](ai-command-engine/references/): task-specific references, including setup and command details.
- [`ai-command-engine/scripts/eda.py`](ai-command-engine/scripts/eda.py): optional Python helper.
- [`ai-command-engine/VERSION`](ai-command-engine/VERSION): skill documentation version.
- [`CHANGELOG.md`](CHANGELOG.md): brief English record of skill documentation changes.
- [`CHANGELOG_ZH.md`](CHANGELOG_ZH.md): Chinese record of skill documentation changes.

## Release and verification status

The v2026.10.29 skill package and publication status are available on its [GitHub release](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.10.29). A public repository or release does not prove that an AI tool has installed or loaded the skill. Verify installation in the intended AI tool separately.

Plugin source, releases, and the plugin's full historical changelog remain in [quhuii-lgtm/easyeda-aicommand](https://github.com/quhuii-lgtm/easyeda-aicommand). This repository's changelog records only skill documentation maintenance and the repository split.

The installable folder contains task instructions, current parameters, necessary limits, and the optional helper. Development tests and release history remain outside the folder and are excluded from the ZIP.
