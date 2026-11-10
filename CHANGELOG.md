# Changelog

## 2026.11.11

- The bilingual guides cover A4 preplanning, the 40-grid default for direct branches and approved exceptions, bends and route candidates, cross-page connections, component replacements, and TEXT verification after reopening.

## 2026.11.08

- Search ports `49720–49729`, reuse compatible services, and report the actual proxy endpoint.
- Update the companion plugin reference to [v0.20.128](https://github.com/quhuii-lgtm/easyeda-aicommand/releases/tag/v0.20.128); plugin and skill versions remain independent.
- Windows / JLCEDA Pro 4.1.93 startup, discovery, automatic connection, SMT entry, and read-only checks passed; Linux host behavior is untested.

## 2026.11.03

- Distribute the local command proxy with the standalone skill. The Windows launcher starts it hidden and checks service health.
- Pin the runtime dependency to `ws` 8.22.0 in the lockfile; installation uses Node.js >=20.17.0 and `npm ci --omit=dev` from the skill root.
- Keep proxy data outside the skill folder so skill updates preserve user data. A compatible running proxy can be reused without a forced replacement.
- Update the companion plugin reference to [v0.20.127](https://github.com/quhuii-lgtm/easyeda-aicommand/releases/tag/v0.20.127). Plugin and skill versions remain independent.
- Download the [English/Chinese skill ZIP](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/download/v2026.11.03/ai-command-engine-skill_v2026.11.03_en-zh.zip) from the [2026.11.03 release page](https://github.com/quhuii-lgtm/easyeda-aicommand-skill/releases/tag/v2026.11.03).

## 2026.10.29

- Clarified structure-based track-width support without a fixed host-version allowlist. Unknown or conflicting fields still report their reason.
- Updated the corresponding plugin link to v0.20.126; retained concise operating instructions and existing workflow requirements.

## 2026.10.28.4

- Made schematic and PCB first-write reading requirements and operation order explicit.
- Unified acceptance items, methods, pass criteria, result format, and save/reopen scope.
- Clarified when to offer optional PCB tools, reuse existing choices, and wait for a decision without adding stepwise approval to necessary authorized work.
- Preserved complete task references and concise bilingual instructions. No plugin runtime or .eext change.

## 2026.10.28.3

- Clarified that ARC duplicate/split checks compare tracks only within the same layer and net; other tracks follow normal checks.
- Updated the corresponding plugin link to v0.20.125. No test data or development history added to the installable skill.

## 2026.10.28.2

- Replaced the long entry point with concise setup, execution rules, and direct task navigation.
- Synced English and Chinese task references with the cleaned Chinese instructions.
- Removed obsolete version diaries and development records from the installable skill; helper tests and release history stay outside the package.
- No plugin runtime, extension package, or plugin version change.

## 2026.10.28.1

- Versioned the standalone skill package as `v2026.10.28.1`, independently of plugin version `v0.20.124`.
- Updated the plugin release-page link and retained pending host acceptance for its final three fixes.

## 2026.10.28

- Synced the standalone skill documentation and prepared the skill-only repository layout.
- Kept the skill documentation version independent from plugin releases.
- Recorded v0.20.123 acceptance and the v0.20.124 local preparation status without claiming a new plugin capability.
- Plugin implementation history remains in the [plugin repository changelog](https://github.com/quhuii-lgtm/easyeda-aicommand/blob/main/CHANGELOG.md).
