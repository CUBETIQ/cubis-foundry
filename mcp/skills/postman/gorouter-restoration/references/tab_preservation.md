# Tab preservation & state restoration

Recommended:
- `StatefulShellRoute.indexedStack` to preserve state per branch.
- Each branch uses its own navigator key.
- Do not rebuild the entire shell on tab switch.

What to preserve:
- current tab index
- each tab stack
- scroll positions (ListView/ScrollController) if necessary
- form drafts using local state or dedicated draft providers (ephemeral)
