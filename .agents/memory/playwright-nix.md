---
name: Playwright on Nix
description: Running Playwright Chromium and installing test dependencies in this NixOS pnpm workspace
---

Playwright's downloaded Chromium is not self-contained: the NixOS workspace may lack shared libraries such as GLib, GTK, and X11 even after `playwright install chromium` succeeds. Install the required system libraries with the package-management skill's Nix dependency callback, using Nix attribute names rather than Debian package names. In this pnpm monorepo, add test packages with a package-scoped `pnpm --filter <workspace-package> add -D <package>` command; the generic package installer may attempt to add at the guarded workspace root.

**Why:** Browser binaries downloaded successfully but did not launch until their host libraries were present, and the generic installer does not expose pnpm's workspace filter.

**How to apply:** When adding browser automation or moving it to another Nix environment, verify both the browser install and an actual launch. Install Chromium libraries via Nix when shared-library errors appear; keep test dependencies scoped to the artifact that owns the tests.

This Replit environment exposes a preinstalled Chromium binary through `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`; Playwright's own browser cache may be empty even though that binary is ready to launch.

**Why:** A fresh package install did not include the Playwright revision expected under the project cache, while the Replit-managed browser was available and launched the tests successfully.

**How to apply:** Prefer this environment-provided executable path in Playwright `launchOptions.executablePath`, with Playwright's default browser as the fallback for other environments.

When a Playwright route fulfills a document that loads a Vite-transformed React module, include Vite's React Refresh preamble (import `/@react-refresh`, inject it into `window`, then set the preamble-installed flag) or React will fail with a missing-preamble error.

**Why:** A fulfilled HTML response bypasses Vite's normal HTML transform, which normally injects the preamble required by the React plugin.

**How to apply:** For test-only intercepted document routes, copy the preamble from the app's Vite-served HTML before loading a TSX module; ordinary browser navigation to Vite-served HTML needs no custom preamble.
