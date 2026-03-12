# UX Writing Reference

## Principles

1. **Clarity over cleverness** — users scan, they don't read. Say what you mean.
2. **Every word earns its place** — if removing a word doesn't change the meaning, remove it.
3. **Active voice** — "Save your changes" not "Changes will be saved."
4. **Speak like a human** — not a lawyer, not a robot, not a marketing deck.
5. **Consistent voice** — choose a tone and maintain it across all touchpoints.

## Button Labels

| Bad        | Better                        | Why                            |
| ---------- | ----------------------------- | ------------------------------ |
| Submit     | Save changes                  | Tells the user what happens    |
| OK         | Got it                        | More conversational            |
| Cancel     | Never mind                    | Friendlier (context-dependent) |
| Click here | View pricing                  | Says what clicking does        |
| Yes / No   | Delete project / Keep project | Action-specific, no ambiguity  |

For destructive actions, name the consequence: "Delete account" not just "Delete."

## Error Messages

Structure: **What happened** + **Why** + **What to do next**

| Bad            | Better                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Error 500      | Something went wrong on our end. Try again in a moment.                 |
| Invalid input  | Email address must include @ and a domain (e.g., you@example.com).      |
| Request failed | Couldn't save your changes — check your connection and try again.       |
| Unauthorized   | You don't have access to this page. Contact your admin for permissions. |

Rules:

- Never blame the user ("You entered an invalid…")
- Never show raw error codes as the primary message
- Always provide a next step or recovery action
- Use a conversational tone, not a system log

## Empty States

Empty states should teach, not apologize:

| Context              | Bad                   | Better                                                                      |
| -------------------- | --------------------- | --------------------------------------------------------------------------- |
| No search results    | No results found.     | No results for "xyz." Try a broader search or check the spelling.           |
| Empty inbox          | You have no messages. | All caught up! New messages will appear here.                               |
| First-time dashboard | No data available.    | Welcome! Connect a data source to start seeing insights here. [Connect now] |
| Empty task list      | No tasks.             | Ready to get started? Add your first task. [Add task]                       |

## Confirmation & Success

- Success messages: brief and specific. "Project saved" > "Your project has been successfully saved."
- Undo confirmation: "Message archived. [Undo]" (include the action + undo)
- Multi-step completion: summarize what was accomplished. "Account created. We sent a verification email to you@example.com."

## Tooltips & Help Text

- Keep under 150 characters
- Explain what something does, not what it is
- Use field help text for complex inputs (below the field, subtle gray)
- Tooltips for icons and abbreviated labels only — not for paragraphs

## Microcopy Checklist

- [ ] All form labels are visible (not placeholder-only)
- [ ] Error messages explain the problem and offer recovery
- [ ] Empty states guide toward first action
- [ ] Buttons describe their action (no generic "Submit" / "OK")
- [ ] Loading states communicate progress or set expectations
- [ ] Destructive actions name the consequence
- [ ] Success confirmations are brief and specific
- [ ] No unexplained jargon or technical codes shown to users
