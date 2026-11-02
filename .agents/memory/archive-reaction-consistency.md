---
name: Reaction state consistency
description: User-facing expectations for archive story likes and their counts.
---

The “liked” label must reflect the server's per-visitor reaction state, and each story's count must come from that same story's server data. The page-wide total must agree with the sum of story counts. Browser storage may retain a visitor identifier, but an old local like flag is not authoritative.

**Why:** A failed unlike response previously caused the UI to restore “liked” after the server had already deleted the reaction, leaving the label and count inconsistent.

**How to apply:** Keep the visitor's reaction status in the resonance API response, include the visitor ID in the query key, and ensure add/remove responses satisfy their declared schema. Verify a full like → read → unlike → read cycle.
