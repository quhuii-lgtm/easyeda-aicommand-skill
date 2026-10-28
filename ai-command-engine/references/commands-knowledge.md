# Design Knowledge and SMT Parts

Use `/help?cmd=<command>` in the target window for parameters and return fields. EDA requests include `cmd`, `instanceId`, and required `params`; macro steps inherit the selected instance. See [connection and setup](setup.md) for request examples.

| Command | Purpose and use | Limits |
| --- | --- | --- |
| `knowledge.query` | Search design rules and experience by keyword. | `query` is required; omitted `limit` defaults to 3, otherwise use a positive integer. Evaluate results against the project and component data. |
| `knowledge.listRules` | List rule topics when choosing a subject to query. | A topic list is not a design conclusion. |
| `knowledge.widthForCurrent` | Estimate a starting trace width from current. | `currentA` must be a finite positive number. The estimate does not replace thermal or manufacturing checks. |

## SMT component search

`smt.queryComponent` runs locally in the proxy; EDA need not be online and no `instanceId` is required. The proxy must be running and have local credentials configured.

Open `http://127.0.0.1:49720/smt` to enter `appId`, `accessKey`, and `secretKey`. Credentials are stored in `bridge/jlc-credentials.json`; saving takes effect immediately and survives proxy upgrades. The page also supports manual searches. Obtain credentials from [JLC Open Platform](https://open.jlc.com) under Quick Access → Create Application. Keep keys local; do not commit or share them.

`components[].code` is the LCSC part number and can be passed to `schematic.placeDevice`.
