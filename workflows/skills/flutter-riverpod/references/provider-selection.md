# Provider Selection

## Decision Guide

- pure derived value -> function provider
- mutable synchronous UI/domain state -> `Notifier`
- async load with mutations -> `AsyncNotifier`
- reactive database or socket stream -> stream-backed provider or notifier

## Lifecycle Rules

- auto-dispose by default for screen or parameter-scoped state
- `keepAlive: true` only for low-cardinality, app-wide, expensive state
- avoid unbounded keep-alive families

## Boundary Rules

- providers stay top-level,
- widgets do not own business state transitions,
- repositories and services remain injectable dependencies.
