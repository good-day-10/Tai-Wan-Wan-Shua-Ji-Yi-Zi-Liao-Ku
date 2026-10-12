---
name: Clerk integration test preflight
description: Safety rules for integration fixtures that may create Clerk users or modify shared archive data.
---

Validate the Clerk environment in both the test runner and the target API server before creating users, sessions, or performing writes. The runner's secret key alone does not prove that requests are reaching an API server configured for the same test instance. Preflight failures must use fixed, configuration-only messages and never include credentials, tokens, or request bodies.

**Why:** Archive integration fixtures can create persistent Clerk users and temporarily modify shared archive content; a CI target pointed at production must stop before those side effects begin.

**How to apply:** Reject non-test Clerk secret keys locally, then ask the API server to confirm its Clerk secret and publishable keys are test-instance keys. Keep configurable test user ID/email and session-cookie paths, but require server verification for each.
