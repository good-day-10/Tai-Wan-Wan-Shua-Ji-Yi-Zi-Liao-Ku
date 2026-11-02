---
name: Archive concurrency protection
description: Optimistic locking rules for shared archive edits
---

Shared archive saves use a server-issued integer revision as the optimistic-lock version. Each successful save must atomically increment the revision after matching `expectedVersion`; stale or missing versions must be rejected rather than applying a whole-archive overwrite.

**Why:** Editors submit the full archive, so accepting an old draft can silently remove another editor's custom pages or copy.

**How to apply:** Keep the version in archive read/save responses, preserve the draft after a 409, and refresh before retrying. Any integration fixture that saves shared data must carry the latest response version and treat it as a number.

Lazy archive-copy initialization must clone from the main row in one `INSERT ... SELECT ... ON CONFLICT DO NOTHING` statement, then re-read the copy row. Competing first readers must all return the committed winner's snapshot and revision.

**Why:** Reading the source first and inserting afterward lets requests race across a source update; only the row that wins the unique-key insert should define the copy's initial state.

**How to apply:** For future lazy-copy paths, do not return a caller's pre-insert source snapshot after a conflict. Read the persisted copy after the atomic insert attempt.