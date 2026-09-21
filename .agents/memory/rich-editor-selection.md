---
name: Rich editor selection handling
description: Browser selection behavior when formatting contentEditable text from a toolbar
---

Toolbar formatting commands should prefer the live selection when it still belongs to the contentEditable editor, and only restore a saved Range after focus has moved away.

**Why:** Preventing a toolbar button's mousedown preserves the selection, but blindly restoring an older Range can make `execCommand` report success while toggling or changing the wrong formatting.

**How to apply:** In contentEditable toolbars, capture the current selection before running a command, use it when it is still inside the editor, and keep a saved Range as the fallback for focus changes.