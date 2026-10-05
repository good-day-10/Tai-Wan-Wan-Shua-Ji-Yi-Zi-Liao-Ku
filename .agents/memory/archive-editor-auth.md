---
name: Archive editor authentication
description: The shared archive keeps visitor reads public while editor writes require both a Clerk session and a server-validated editor unlock.
---

Visitor access and editor access are intentionally separate: GET archive remains public, while unlocking and saving require a Clerk-authenticated user. A server-side owner email allowlist lets the owner account enter editor mode without the secondary editor-password prompt; other signed-in users still need that password. The editor password is validated only on the server, and successful unlock is represented by a signed, HttpOnly cookie bound to both the user and active Clerk session rather than by client state or the save payload.

**Why:** The archive must remain easy to browse, the owner needs a lower-friction editing path, and a user-bound cookie alone survives a same-account session change. The editor password must never be shipped in the public bundle or exposed in error messages.

**How to apply:** Keep editor credentials out of frontend code, localStorage, API responses, and save requests. Any new write endpoint must require the matching active Clerk user/session and the server-side editor-access marker; do not try to identify an unauthenticated browser as the owner.