# Example: Update Existing Screen

Prompt shape:

> Re-fetch the "Profile Settings" Stitch screen and patch my existing implementation in `app/settings/profile/page.tsx`. Only update the parts that changed.

Expected workflow:

1. Pull the refreshed Stitch artifact first.
2. Compare the local screen against the latest design.
3. Apply a minimal diff to structure, tokens, copy, or states.
4. Preserve working local logic and component boundaries.
5. Report what changed and any remaining drift.
