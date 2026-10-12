---
name: Archive editor authentication
description: The shared archive keeps visitor reads public while editor writes require both a Clerk session and a server-validated editor unlock.
---

Visitor access and editor access are intentionally separate: GET archive remains public, while unlocking and saving require a Clerk-authenticated user. Before unlocking or saving, the API must fetch the session from Clerk and confirm it is still active; local JWT verification alone does not ensure a token's session has not been revoked. A server-side owner email allowlist lets the owner account enter editor mode without the secondary editor-password prompt; other signed-in users still need that password. The editor password is validated only on the server, and successful unlock is represented by a signed, HttpOnly cookie bound to both the user and active Clerk session rather than by client state or the save payload.

**Why:** The archive must remain easy to browse, the owner needs a lower-friction editing path, and a user-bound cookie alone survives a same-account session change. Clerk JWT verification may accept an unexpired token after its session is revoked, so mutations also need a live server-side status check. The editor password must never be shipped in the public bundle or exposed in error messages.

**How to apply:** Keep editor credentials out of frontend code, localStorage, API responses, and save requests. Any new write endpoint must require an active Clerk session confirmed through the Backend API, plus the matching server-side editor-access marker; fail closed if the session is revoked or cannot be verified. Keep visitor GET endpoints public.

Independent archive copies may reuse the Clerk tenant, owner rule, and editor password, but must isolate the stored archive identity, optimistic revision stream, browser cache key, and signed editor-access cookie. Do not let one site's unlock or stale local cache authorize or populate another site.

**Why:** Copies are meant to evolve independently even though they share the same editor policy; reusing any per-site state can leak draft data or permit unintended writes across sites.

**How to apply:** When adding another copy, give it dedicated read/save endpoints and cookie/cache identifiers, then verify that cross-site cookies fail and a save remains isolated from the source archive.