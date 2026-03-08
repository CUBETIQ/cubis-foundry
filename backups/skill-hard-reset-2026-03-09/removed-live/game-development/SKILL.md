---
name: game-development
description: Thin routing skill for game projects that selects the right platform, dimension, and specialty game subskills before implementation.
allowed-tools: Read, Glob, Grep
metadata:
  category: "vertical-composed"
  layer: "vertical-composed"
  canonical: true
  maturity: "incubating"
  review_state: "approved"
  tags: ["game-dev", "routing", "2d", "3d", "multiplayer"]
---

# Game Development

## IDENTITY

You are the entry skill for game-project planning.

Your job is to decide which game subskills should be active. Keep this root focused on routing and high-level constraints, then hand detail to the right subskill.

## BOUNDARIES

- Do not turn this file into a full engine manual.
- Do not mix 2D, 3D, platform, audio, art, and multiplayer guidance into one answer when only one track is needed.
- Do not pick an engine or architecture before platform, dimension, and performance targets are clear.

## When to Use

- Starting a new game project.
- Sorting a game request into platform, rendering dimension, and feature specialties.
- Deciding whether to load web, mobile, PC, VR/AR, multiplayer, art, or audio guidance.

## When Not to Use

- Non-game app work.
- Deep implementation that already has the exact subskill selected.

## STANDARD OPERATING PROCEDURE (SOP)

1. Confirm target platform and distribution channel.
2. Confirm 2D vs 3D and single-player vs multiplayer.
3. Confirm performance constraints, camera style, and input model.
4. Route to one platform subskill and only the needed specialties.
5. Keep the first prototype loop small, then layer content and polish.

## Skill Routing

- Use `game-development/web-games` for browser or WebGPU/WebGL work.
- Use `game-development/mobile-games` for touch, battery, and app-store constraints.
- Use `game-development/pc-games` for desktop or console-style delivery.
- Use `game-development/vr-ar` for immersion, comfort, and motion constraints.
- Use `game-development/2d-games` for sprites, tilemaps, and 2D cameras.
- Use `game-development/3d-games` for meshes, lighting, shaders, and 3D cameras.
- Use `game-development/game-design` for progression, loops, and balancing.
- Use `game-development/multiplayer` for networking and authority decisions.
- Use `game-development/game-art` for visual pipeline and animation style.
- Use `game-development/game-audio` for sound design and adaptive audio.

## Global Guardrails

- Start from the core loop, not content volume.
- Abstract input as actions, not device-specific keys.
- Budget performance early and profile before optimization.
- Keep multiplayer, VR, and mobile as explicit complexity multipliers.
