---
name: flutter-go-router
description: "Use when adding or refactoring typed GoRouter navigation, guards, shell routes, deep links, or notification-driven routing in Flutter. Do not use for state management or feature business logic."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Flutter GoRouter

## Purpose

Guide typed Flutter navigation architecture with safe redirects, deep-link
handling, and predictable shell-route behavior.

## When to Use

- Adding a route or nested route
- Introducing auth or init guards
- Adding a bottom-nav shell
- Handling deep links or FCM notification taps
- Fixing redirect loops or back-stack issues

## Instructions

1. Define the route map and parameter shape first.
2. Choose the right route type for the navigation behavior.
3. Use typed route classes instead of raw string paths in widgets.
4. Keep `redirect` and `onEnter` pure, fast, and loop-safe.
5. Validate deep-link inputs before building pages.
6. Preserve branch stacks intentionally when using shell navigation.
7. Add tests for guards, deep links, and shell-route behavior where the flow is non-trivial.

## Output Format

Produce navigation guidance or code that:

- uses typed routes intentionally,
- explains guard and deep-link decisions,
- identifies shell-route versus standard-route boundaries,
- includes edge cases for invalid params or redirect loops.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/typed-routes.md` | Defining route files, params, query handling, or typed route usage patterns. |
| `references/guards-and-deeplinks.md` | Adding auth guards, splash/init gates, notification routing, or shell-route preservation. |

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Add a typed detail route and deep-link handling for products."
- "Set up a stateful shell route for Flutter bottom navigation."
