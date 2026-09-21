---
name: Archive editor authentication
description: The shared archive keeps visitor reads public while editor writes require both a Clerk session and a server-validated editor unlock.
---

Visitor access and editor access are intentionally separate: GET archive remains public, while unlocking and saving require a Clerk-authenticated user. The editor password is validated only on the server, and successful unlock is represented by a signed, HttpOnly, user-bound cookie rather than by client state or the save payload.

**Why:** The archive must remain easy to browse, but an authenticated account alone should not grant editing access and the editor password must never be shipped in the public bundle or exposed in error messages.

**How to apply:** Keep editor credentials out of frontend code, localStorage, API responses, and save requests. Any new write endpoint must require the Clerk session and the server-side editor-access marker.