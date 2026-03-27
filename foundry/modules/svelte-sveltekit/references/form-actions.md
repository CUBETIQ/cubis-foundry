# SvelteKit Form Actions Reference

## Defining Actions

```typescript
// +page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    if (!email) return fail(400, { email, missing: true });
    await sendEmail(email);
    return { success: true };
  }
} satisfies Actions;
```

### Named Actions

```typescript
export const actions = {
  create: async ({ request }) => { /* ... */ },
  delete: async ({ request }) => { /* ... */ },
} satisfies Actions;
```

Invoke with `<form method="POST" action="?/create">` or cross-route: `action="/todos?/create"`.

## The fail() Helper

```typescript
return fail(400, {
  values: { name, email },
  errors: result.error.flatten().fieldErrors
});
```

## Accessing Action Data

```svelte
<script lang="ts">
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>
{#if form?.errors?.email}<p class="error">{form.errors.email[0]}</p>{/if}
<form method="POST">
  <input name="email" value={form?.email ?? ''} />
</form>
```

## Progressive Enhancement with use:enhance

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let submitting = $state(false);
</script>
<form method="POST" use:enhance={() => {
  submitting = true;
  return async ({ result, update }) => {
    submitting = false;
    if (result.type === 'success') showToast('Saved!');
    await update();
  };
}}>
  <button disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
</form>
```

Result types: `'success'`, `'failure'`, `'redirect'`, `'error'`.

### Optimistic Updates

```svelte
<form method="POST" action="?/toggle" use:enhance={() => {
  todo.completed = !todo.completed;
  return async ({ result, update }) => {
    if (result.type === 'failure') todo.completed = !todo.completed;
    await update({ reset: false });
  };
}}>
```

## Validation with Zod

```typescript
const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email()
});

export const actions = {
  default: async ({ request }) => {
    const raw = Object.fromEntries(await request.formData());
    const result = schema.safeParse(raw);
    if (!result.success) return fail(400, { values: raw, errors: result.error.flatten().fieldErrors });
    await saveContact(result.data);
    return { success: true };
  }
} satisfies Actions;
```

## Redirects

```typescript
import { redirect } from '@sveltejs/kit';
// Always use 303 for POST-redirect-GET pattern
throw redirect(303, '/dashboard');
```

## CSRF Protection

SvelteKit checks the `Origin` header automatically. Configure in `svelte.config.js`:

```javascript
kit: { csrf: { checkOrigin: true } }  // default: true
```

## Common Patterns

**File upload:** Parse `FormData`, check `file.size`, call `file.arrayBuffer()` for processing.

**Multi-step forms:** Store intermediate data in `httpOnly` cookies between steps, combine on final submit.
