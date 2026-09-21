---
name: Archive concurrency protection
description: Optimistic locking rules for shared archive edits
---

Shared archive saves use the server-returned `updatedAt` ISO value as the optimistic-lock version. A save must send that value as `expectedVersion`; the server must reject stale or missing versions rather than applying a whole-archive overwrite.

**Why:** Editors submit the full archive, so accepting an old draft can silently remove another editor's custom pages or copy.

**How to apply:** Keep the version in archive read/save responses, preserve the draft after a 409, and refresh before retrying. Any integration fixture that saves shared data must carry the latest response version.