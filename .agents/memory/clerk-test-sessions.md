---
name: Clerk integration test sessions
description: Backend-created Clerk sessions authenticate archive integration requests through Authorization in development instances.
---

Clerk development instances may use suffixed browser cookies and client state that are not present when a test only sends a raw `__session` cookie. A Backend SDK session token is reliably accepted as an `Authorization: Bearer` header; keep any generated cookie in memory only for compatibility with the archive request helper.

**Why:** A raw session cookie looked valid but was treated as signed out by the Express middleware, while the same Clerk-generated token in the standard authorization header authenticated successfully.

**How to apply:** When creating test sessions with `@clerk/backend`, use the token for the request authorization header, revoke the session in teardown, and never include the token in assertion messages or logs.