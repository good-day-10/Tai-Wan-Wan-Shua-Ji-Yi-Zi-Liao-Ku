---
name: Playwright on Nix
description: Running Playwright Chromium and installing test dependencies in this NixOS pnpm workspace
---

Playwright's downloaded Chromium is not self-contained: the NixOS workspace may lack shared libraries such as GLib, GTK, and X11 even after `playwright install chromium` succeeds. Install the required system libraries with the package-management skill's Nix dependency callback, using Nix attribute names rather than Debian package names. In this pnpm monorepo, add test packages with a package-scoped `pnpm --filter <workspace-package> add -D <package>` command; the generic package installer may attempt to add at the guarded workspace root.

**Why:** Browser binaries downloaded successfully but did not launch until their host libraries were present, and the generic installer does not expose pnpm's workspace filter.

**How to apply:** When adding browser automation or moving it to another Nix environment, verify both the browser install and an actual launch. Install Chromium libraries via Nix when shared-library errors appear; keep test dependencies scoped to the artifact that owns the tests.
