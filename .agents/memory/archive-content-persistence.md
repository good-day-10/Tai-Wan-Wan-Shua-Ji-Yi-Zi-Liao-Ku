---
name: Archive content persistence
description: Backward-compatible handling for shared archive page copy and layout data
---

Persisted page content is optional for legacy archive rows. Visitor rendering must normalize missing or partial `siteContent` by merging saved blocks over the complete default block set, while preserving saved rich text and layout values.

**Why:** Existing archive data can predate the page editor, so treating a missing content column as an error would hide the archive instead of showing safe defaults.

**How to apply:** Keep API responses backward-compatible and test both legacy fallback and two independent reads after a save.

Integration cleanup must omit `siteContent` when the original legacy response omitted it; sending an empty object violates the save contract because `blocks` is required whenever `siteContent` is present.

**Why:** A legacy row can have a null content column, while the API schema intentionally requires a complete block list for any newly supplied content object.

**How to apply:** Preserve the original optional-field shape when restoring fixtures after persistence tests.