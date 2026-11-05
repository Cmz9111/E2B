---
'@e2b/cli': patch
---

Fix `e2b template create --no-cache`, which was ignored and always built with the cache. `e2b sandbox list` and `e2b sandbox kill` now reject unknown `--state` values (anything other than `running` or `paused`) instead of sending them to the API.
