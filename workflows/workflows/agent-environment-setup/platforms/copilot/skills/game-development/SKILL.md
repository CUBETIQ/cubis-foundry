---
name: game-development
description: "Use when implementing game mechanics, game loops, physics, AI, collision detection, or performance optimization for web, mobile, PC, or VR/AR games."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Game Development

## Purpose

Use when implementing game mechanics, game loops, physics, AI, collision detection, or performance optimization for web, mobile, PC, or VR/AR games.

## When to Use

- Implementing core game loops (input, update, render) for any platform.
- Choosing game architecture patterns (ECS, state machine, object pooling).
- Implementing collision detection, physics, or spatial partitioning.
- Designing game AI (FSM, behavior trees, utility AI, GOAP).
- Optimizing game performance to hit 60 FPS budgets.
- Platform-specific game delivery (web, mobile, desktop, VR/AR).

## Instructions

1. Determine target platform and rendering approach.
2. Implement the core game loop with fixed timestep for physics and variable timestep for rendering.
3. Choose architecture patterns based on entity count and complexity.
4. Implement game systems in priority order: input, physics/collision, game logic, rendering, audio.
5. Profile early and continuously against the performance budget.

### Baseline standards

- Performance budget: 60 FPS = 16.67ms per frame (input 1ms, physics 3ms, game logic 4ms, render 6ms, audio 1ms, overhead 1.67ms).
- Use object pooling for frequently created/destroyed entities.
- Separate game logic from rendering for testability.
- Use spatial partitioning for collision detection at scale.
- Implement deterministic physics with fixed timestep.

### Pattern selection

| Pattern         | When to Use                                     |
| --------------- | ----------------------------------------------- |
| State Machine   | Character states, UI flow, game phases          |
| ECS             | Large entity counts, data-driven composition    |
| Object Pooling  | Bullets, particles, frequently spawned entities |
| Command Pattern | Input handling, replay, undo                    |
| Observer        | Events, achievements, UI updates                |

### AI selection by complexity

| Complexity | Approach                                   |
| ---------- | ------------------------------------------ |
| Simple     | Finite State Machine (FSM)                 |
| Medium     | Behavior Tree                              |
| Complex    | GOAP or Utility AI                         |
| Adaptive   | Machine learning (rare in real-time games) |

### Constraints

- Never allocate memory in the hot path (game loop).
- Never use floating point equality for physics comparisons.
- Never couple game logic directly to frame rate.
- Always handle edge cases in collision detection (tunneling, resting contact).

## Output Format

Provide implementation guidance, code examples, architecture diagrams, and performance budgets as appropriate.

## References

No reference files for this skill right now.

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Help me implement a game loop with fixed timestep physics"
- "Choose the right collision detection strategy for my 2D platformer"
- "Design an entity component system for my RTS game"
