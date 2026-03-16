# Example: New Screen From Stitch

Prompt shape:

> Use Stitch to find the "Billing Overview" screen, fetch the latest artifacts, and implement it in my Next.js app using the existing design system. Keep accessibility and responsive behavior intact.

Expected workflow:

1. Confirm Stitch is available with `stitch_get_status` and `stitch_list_enabled_tools`.
2. Fetch the target screen artifact.
3. Identify the destination route, layout shell, and shared components in the repo.
4. Implement the screen with project tokens/components instead of raw generated markup.
5. Summarize any intentional deviations from Stitch.
