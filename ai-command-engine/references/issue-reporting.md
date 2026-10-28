# Report a Plugin Issue

Use this process for plugin errors or mismatches between returned results and readback. Prepare the report below, tell the user what will be submitted, then submit it with the user's current GitHub identity to `quhuii-lgtm/easyeda-aicommand`. Do not wait for another per-item confirmation. Follow an explicit request not to submit.

## First-Time Setup

- Node.js >=20.17.0 must be installed, matching the command proxy requirement.
- Install [GitHub CLI](https://cli.github.com/). The user completes sign-in once:

```powershell
gh auth login --hostname github.com --web
gh auth status --hostname github.com
```

Use the active GitHub CLI identity. An existing `GH_TOKEN` or `GITHUB_TOKEN` may affect that identity. The user must switch accounts through GitHub CLI when needed. A browser or Git sign-in does not prove GitHub CLI is signed in.

The tool does not request, print, or save GitHub tokens. GitHub CLI manages credentials. Never put a token in the report, plugin source, or chat.

This feature does not require EDA, a command-proxy connection, or an `instanceId`.

## Reporting Rules

1. Record only an issue actually encountered. Add missing reproduction details; use “unknown” for an unconfirmed version. Separate observed facts from suspected causes.
2. Include only necessary evidence already obtained and safe to publish. Remove secrets, tokens, personal information, and private project data. Do not scan the whole project or upload full logs or project files just to create a report. The tool does not redact content automatically; check it before writing the report.
3. Save a UTF-8 JSON report in the system temporary directory. Run `preview` from the plugin repository and read the title and body that will be submitted.
4. Tell the user in the conversation which repository will receive a public report, the issue title and main content, and what evidence it includes. Then run `submit` without adding per-item confirmation steps. Tool output alone does not count as notifying the user.
5. On success, return the Issue URL. If the user is not signed in, the tool is unavailable, or GitHub rejects the request, report that accurately and keep the local draft. Generic GitHub rejection messages do not establish a specific permission or rate-limit cause.
6. If creation is uncertain, check the issue list before retrying. If the issue was created but readback failed, provide the retained URL and explain that it has not been verified; do not create it again.

This is a local tool run explicitly by the AI, not background error monitoring. EDA command execution does not upload data automatically. The script cannot verify that the user was notified; the AI must follow this process.

## Report Format

All values are strings. Required fields: `title`, `pluginVersion`, `edaVersion`, `os`, `steps`, `expected`, and `actual`. Optional fields: `command` and `evidence`. No other fields are supported; unknown fields are not silently discarded.

```json
{
  "title": "[Issue] Returns success after save, but target text remains",
  "pluginVersion": "0.20.124",
  "edaVersion": "unknown",
  "os": "Windows 11",
  "steps": "1. Open a test page\n2. Delete the target text\n3. Save and read the target again",
  "expected": "The target text is deleted and readback confirms it is absent.",
  "actual": "The command returns success, but readback still finds the text. This is a format example, not evidence of a real defect.",
  "command": "schematic.delete; object identifier replaced",
  "evidence": "Include only a relevant, redacted error excerpt."
}
```

The example only demonstrates formatting; never submit it as a real issue. `evidence` is plain body text; it does not read attachments or file paths. Submit one issue per distinct problem and avoid duplicating an issue already recorded.

## Preview and Submit

From the plugin repository directory containing `bridge`, run these commands with the report created by the AI:

```powershell
node bridge/report-issue.mjs preview --file "$env:TEMP\aicommand-issue.json"
node bridge/report-issue.mjs submit --file "$env:TEMP\aicommand-issue.json"
```

`preview` validates the local format and renders the body without network access. `submit` checks GitHub CLI sign-in, creates the public Issue, then reads it back to verify the title, body, and URL.

Calls are fixed to `github.com/quhuii-lgtm/easyeda-aicommand`; they do not use another repository from the current directory. Exit code 0 means the operation succeeded. For non-zero results, inspect the JSON error. There is no automatic sign-in, retry, or background resubmission. An unknown result does not mean no Issue was created.

The web form is at `.github/ISSUE_TEMPLATE/bug_report.yml` and uses the same information fields. Web submissions and API submissions are validated separately; the web form does not replace this tool's input validation.

Sources: [GitHub CLI sign-in](https://cli.github.com/manual/gh_auth_login), [GitHub CLI API](https://cli.github.com/manual/gh_api), and [Create an Issue](https://docs.github.com/en/rest/issues/issues#create-an-issue).
