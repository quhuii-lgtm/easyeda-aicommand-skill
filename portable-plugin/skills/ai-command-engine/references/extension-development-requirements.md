# Extension Development Requirements

Read this page only when developing, changing, or reviewing plugin commands.

- Implement the feature and make its normal workflow work before reviewing whether safeguards are necessary. Do not let extra restrictions or development checks block the feature.
- A command must perform its stated operation and check its own result. Do not make development notes, test steps, or acceptance procedures prerequisites for normal use.
- Do not add unnecessary limits for developer convenience, past issues, or host differences. Adapt the extension to host differences instead of using extra restrictions as a substitute for a fix.
- Perform checks inside the plugin when it can do them; do not shift them to users. Keep only checks needed to prevent writing to the wrong project, incorrect connections, duplicate writes, or clear runtime errors. For each new restriction, state the specific error it prevents and prefer handling it inside the plugin.
- When the result is known, return a clear success or failure. When it cannot be confirmed, explain why and stop dependent operations; never retry an unknown write automatically.
- Before delivery, verify the normal user workflow; compilation alone is insufficient.
- After modifying with an asynchronous handle, `await done()` and then fetch the object independently. Batch `get` results may be shorter when items do not match; match by graphic ID, not array position or a stale modified handle's own readback.
- The IFrame API used by the DFM menu is marked beta by the official source. Treat this as compatibility context; do not disable a verified menu or add user confirmation solely for that reason.
