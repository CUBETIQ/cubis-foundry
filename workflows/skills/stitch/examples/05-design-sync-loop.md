# Example: Iterative Design Sync Loop

Prompt shape:

> Re-sync the account settings screen from Stitch, patch only the UI diff, and leave the saved form logic intact.

Expected workflow:

1. Verify the Foundry gateway and Stitch tool availability first.
2. Identify the existing local settings screen and use it as the current diff baseline.
3. Fetch the latest Stitch artifact for the matching settings screen.
4. Compare local UI structure, spacing, copy, states, and assets against the refreshed Stitch artifact.
5. Apply the smallest patch that restores visual parity while preserving the repo's routing, validation, and submission logic.
6. Report what changed in this pass and what the next Stitch refresh should check if the screen evolves again.

This pattern is intentionally iterative: treat each Stitch refresh as a controlled sync pass, not a full rewrite.
