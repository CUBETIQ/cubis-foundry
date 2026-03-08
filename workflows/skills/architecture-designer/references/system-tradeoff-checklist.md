# System Tradeoff Checklist

Load this when architecture design needs a sharper decision frame.

## Core framing

- Start from product goals, scale expectations, and failure tolerance.
- Identify which decisions are expensive to reverse and which are not.
- Keep non-goals explicit so the system is not over-designed.

## Boundaries

- Define ownership, interfaces, and data movement clearly.
- Decide what belongs in-process, behind a service boundary, or in async flow.
- Keep observability, security, and operations inside the architecture discussion.

## Decision quality

- Compare a small number of viable shapes instead of arguing from a favorite stack.
- Document tradeoffs in concrete cost, risk, and team-operability terms.
- Prefer the smallest durable architecture that meets the current target.

## Handoff

- Leave explicit constraints, open risks, and validation checkpoints.
- Make rollout and rollback posture visible when architecture changes production behavior.
