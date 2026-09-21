---
name: Archive content persistence
description: Backward-compatible handling for shared archive page copy and layout data
---

Persisted page content is optional for legacy archive rows. Visitor rendering must normalize missing or partial `siteContent` by merging saved blocks over the complete default block set, while preserving saved rich text and layout values.

**Why:** Existing archive data can predate the page editor, so treating a missing content column as an error would hide the archive instead of showing safe defaults.

**How to apply:** Keep API responses backward-compatible and test both legacy fallback and two independent reads after a save.