# AI Command Engine Companion Plugin

One package contains the AI Command Engine skill, its existing scripts and references, and a reusable collaboration policy. The policy defaults to concise Chinese and follows the user's language preference. [中文安装说明](README_ZH.md)

- Use the plugin directory with a client that supports Agent Plugins. A Codex compatibility manifest and a Claude Code plugin manifest are included.
- For Kimi Code, OpenCode, or another Agent Skills client, import the directories under `skills/` using that client's skill location. Copy directories with their scripts and references.
- To apply the conversation and execution policy to unrelated tasks, merge the packaged `AGENTS.md` into the instruction file your client reads, such as `CLAUDE.md` in Claude Code. Preserve existing instructions. When working with AI Command Engine, its skill also links to the packaged policy. The `agent-workflow` skill is available for explicit use in other tasks.

EDA operations require local execution on the machine running the compatible JLCEDA Pro extension and the included local proxy. Follow [Connection and Environment](skills/ai-command-engine/references/setup.md) for dependencies and startup. For AI Command Engine in Chinese, use [the Chinese entry](skills/ai-command-engine/SKILL_ZH.md). Subagent selection respects the user's instructions, client tools, and permissions.
