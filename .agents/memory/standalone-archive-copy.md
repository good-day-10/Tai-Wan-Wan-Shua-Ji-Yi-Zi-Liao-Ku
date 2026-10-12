---
name: Standalone archive copy
description: Data and deployment boundary for the independent 少年導覽隊 Replit project.
---

The standalone 少年導覽隊 site is intended to use its own Replit-managed PostgreSQL database, initialized once with the copy-site data. Do not attempt to share the original Replit project's managed database URL. Saves and revision synchronization stay within the standalone site; they do not sync back to the original project.

**Why:** Replit-managed databases are scoped to each project, and the user chose an independent data store to support a separate production URL without coupling edits to the original site's archive.

**How to apply:** When preparing or verifying the new Repl, use its own `DATABASE_URL`, ensure the `memory-archive-copy` row is seeded explicitly (a blank new DB has no `main` row to copy from), and confirm no write path targets the original project's `main` data.
