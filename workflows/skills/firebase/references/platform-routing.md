# Firebase Platform Routing

Load this when the task is Firebase-specific but the exact product surface is still unclear.

## Routing

- Firestore: document modeling, composite indexes, query limits, and rules coupling.
- Realtime Database: tree shape, fan-out, listener behavior, and simpler realtime synchronization.
- Auth: sign-in providers, session flow, user identity, and backend policy coupling.
- Storage: object lifecycle, access rules, uploads, and media-heavy workloads.
- Cloud Functions: backend triggers, scheduled jobs, and server-side integration points.
- Hosting and Emulator Suite: local confidence, preview flow, and safe rollout checks.

## Rule

Keep Firebase product boundaries explicit. Do not answer a Firestore problem as if it were only a generic database problem.
