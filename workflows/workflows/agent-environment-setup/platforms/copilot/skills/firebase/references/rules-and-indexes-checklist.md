# Firebase Rules And Indexes Checklist

Load this when security rules, index requirements, or rollout safety are the main risk.

## Checklist

- Confirm which Firebase product owns the access rule.
- Review auth assumptions before changing client reads or writes.
- Check whether query changes need index updates or new composite indexes.
- Keep emulator validation in the plan before shipping rule or index changes.
- Do not widen reads or writes without stating the blast radius.
