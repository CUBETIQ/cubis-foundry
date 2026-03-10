---
name: flutter-go-router
description: >
  Use when adding or refactoring typed GoRouter navigation, guards, shell
  routes, deep links, or notification-driven routing in Flutter. Do not use
  for state management or feature business logic.
---

# Flutter GoRouter

## Overview

Use this skill for navigation architecture built on typed routes. Keep routing
declarative, predictable, and free of widget-level string path usage.

## When to Use

- Adding a route or nested route
- Introducing auth or init guards
- Adding a bottom-nav shell
- Handling deep links or FCM notification taps
- Fixing redirect loops or broken back-stack behavior

## Core Workflow

1. Define the route map and parameter shape.
2. Choose the right route type (`GoRouteData`, `ShellRouteData`, or stateful shell).
3. Keep redirects pure, fast, and loop-safe.
4. Validate deep-link inputs before building pages.
5. Add navigation tests for guards and shell behavior.

## Core Rules

- Use typed route classes instead of raw string paths in widgets.
- Keep `redirect` and `onEnter` free of async side effects.
- Preserve branch stacks intentionally when using bottom navigation.
- Pass lightweight IDs or query params instead of large objects when possible.
- Handle invalid deep links explicitly.

## Load References When Needed

| File | Load when |
| --- | --- |
| `references/typed-routes.md` | Defining route files, params, query handling, or typed route usage patterns. |
| `references/guards-and-deeplinks.md` | Adding auth guards, splash/init gates, FCM tap routing, or shell-route preservation. |
