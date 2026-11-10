# Design Knowledge and SMT Parts

Use `/help?cmd=<command>` in the target window for parameters and return fields. EDA requests include `cmd`, `instanceId`, and required `params`; macro steps inherit the selected instance. See [connection and setup](setup.md) for request examples.

| Command | Purpose and use | Limits |
| --- | --- | --- |
| `knowledge.query` | Search design rules and experience. | Evaluate against project and component data. |
| `knowledge.listRules` | List rule topics when choosing a subject to query. | A topic list is not a design conclusion. |
| `knowledge.widthForCurrent` | Estimate trace width from current. | Check thermal and manufacturing requirements separately. |

## SMT component search

`smt.queryComponent` runs locally in the proxy; EDA need not be online and no `instanceId` is required. The proxy must be running and have local credentials configured.

Use the current proxy `baseUrl` from [connection and setup](setup.md), for example `<baseUrl>/smt`, to enter `appId`, `accessKey`, and `secretKey`. Credentials are stored in `%LOCALAPPDATA%/ai-command-engine/jlc-credentials.json`; saving takes effect immediately. The page also supports manual searches. Obtain credentials from [JLC Open Platform](https://open.jlc.com) under Quick Access → Create Application. Keep keys local; do not commit or share them.

`components[].code` is the LCSC part number and can be passed to `schematic.placeDevice`.
