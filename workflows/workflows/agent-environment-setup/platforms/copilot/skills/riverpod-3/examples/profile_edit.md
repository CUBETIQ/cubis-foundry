# Example: Profile edit flow (load + edit + save, loop-free)

Goal:
- Load profile (AsyncNotifier build)
- Edit in UI without triggering network calls per keystroke
- Save -> invalidateSelf -> refresh

Pattern:
- Controller exposes AsyncValue<ProfileState>.
- Text fields use local `TextEditingController` for draft edits.
- On Save: call controller.save(draft) (ref.read(notifier))
- After save success: controller invalidates itself so build reloads canonical data.

This avoids the common anti-pattern:
- writing draft state directly into provider on each keystroke (causes rebuild storms).
