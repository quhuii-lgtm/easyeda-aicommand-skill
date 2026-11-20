# KiCadRoutingTools notice

The optional KiRouting backend installs the upstream KiCadRoutingTools v0.18.0 release (tag commit `21bdace6575876aaec501017aea29f098d2864fc`). The release archive is fetched from the fixed URL and verified against SHA-256 `500ad5a32743e80420809a3a190125df97e70b5a93832f4a1cd67057413e3bf0` before extraction.

Upstream project: https://github.com/drandyhaas/KiCadRoutingTools

The upstream MIT license is reproduced in `LICENSE`. The installer does not run upstream batch files and places the isolated environment under the user's application state directory. It applies the source adapters declared in `scripts/kirouting-runtime-patches.json`, checking both original and adapted hashes: length-target candidate selection, preservation of exact via dimensions, and reconstruction of differential-pair lead-ins from continuous endpoints selected by the router's clearance search. The differential adapter does not change requested pair gaps, the routing grid, or the downstream clearance validator. The Rust binary remains unchanged.
