# Example 02: SvelteKit Form Action -- Login with Progressive Enhancement

## Scenario

Build a login form using SvelteKit form actions with Zod validation, progressive enhancement via `use:enhance`, and proper error/loading state handling.

## Prompt

> Implement a SvelteKit login page with email and password fields. Use a form action in +page.server.ts with Zod validation, return errors with fail(), and progressively enhance the form with use:enhance. Show loading state during submission and display field-level errors.

## Expected Output

### `src/routes/login/+page.server.ts`

```typescript
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
});

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, '/dashboard');
  }
};

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    const result = loginSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return fail(400, {
        email: rawData.email as string,
        errors: fieldErrors
      });
    }

    const { email, password } = result.data;

    // Replace with your auth service
    const user = await authenticateUser(email, password);

    if (!user) {
      return fail(401, {
        email,
        errors: { email: ['Invalid email or password'] }
      });
    }

    cookies.set('session', user.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    throw redirect(303, '/dashboard');
  }
} satisfies Actions;

async function authenticateUser(email: string, password: string) {
  // Stub -- replace with real auth service call
  return { sessionToken: 'tok_example', id: '1', email };
}
```

### `src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let submitting = $state(false);
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<main>
  <h1>Log in</h1>

  <form
    method="POST"
    use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        submitting = false;
        await update();
      };
    }}
  >
    <div class="field">
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={form?.email ?? ''}
        aria-invalid={form?.errors?.email ? 'true' : undefined}
        aria-describedby={form?.errors?.email ? 'email-error' : undefined}
        required
      />
      {#if form?.errors?.email}
        <p id="email-error" class="error" role="alert">
          {form.errors.email[0]}
        </p>
      {/if}
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        aria-invalid={form?.errors?.password ? 'true' : undefined}
        aria-describedby={form?.errors?.password ? 'password-error' : undefined}
        required
      />
      {#if form?.errors?.password}
        <p id="password-error" class="error" role="alert">
          {form.errors.password[0]}
        </p>
      {/if}
    </div>

    <button type="submit" disabled={submitting}>
      {#if submitting}
        Logging in...
      {:else}
        Log in
      {/if}
    </button>
  </form>
</main>
```

### `src/routes/login/+error.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
</script>

<main>
  <h1>{$page.status}: {$page.error?.message}</h1>
  <p>Something went wrong. Please try again or contact support.</p>
  <a href="/login">Back to login</a>
</main>
```

## Key Patterns Demonstrated

1. **Form actions with `satisfies Actions`** -- The `satisfies` keyword provides full type checking on the actions object while preserving the inferred return type for `ActionData`.

2. **Zod `safeParse` + `fail()`** -- Using `safeParse` avoids throwing; `flatten().fieldErrors` produces a field-keyed error map that the template can render per-input.

3. **`use:enhance` callback** -- The callback receives lifecycle hooks. Setting `submitting = true` on entry and `false` on return (whether success or failure) drives the loading state.

4. **ARIA attributes for accessibility** -- `aria-invalid` and `aria-describedby` link each input to its error message, making validation errors announced by screen readers.

5. **Secure cookie configuration** -- `httpOnly`, `sameSite: 'lax'`, and `secure: true` follow OWASP session cookie recommendations to prevent XSS and CSRF.

6. **Progressive enhancement** -- The form works without JavaScript (native POST to the server action). `use:enhance` adds the SPA experience on top.
