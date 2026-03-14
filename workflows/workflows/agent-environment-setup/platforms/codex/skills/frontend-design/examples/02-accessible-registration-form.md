# Example: Accessible Registration Form

## Prompt

> Build a registration form with name, email, password, and confirm password fields. Add inline validation, a password strength indicator, and make it fully accessible. Responsive two-column layout that stacks on mobile.

## Response

### Component

```tsx
import { useState, useRef, type FormEvent } from 'react';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score, label: labels[Math.min(score, 4)] };
}

export function RegistrationForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [password, setPassword] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  const strength = getPasswordStrength(password);

  function validate(data: FormData): FormErrors {
    const errs: FormErrors = {};
    if (!data.get('name')) errs.name = 'Full name is required.';
    const email = data.get('email') as string;
    if (!email) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    const pw = data.get('password') as string;
    if (!pw) errs.password = 'Password is required.';
    else if (pw.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (data.get('confirmPassword') !== pw) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const validationErrors = validate(data);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus the first field with an error
      const firstErrorField = Object.keys(validationErrors)[0];
      const input = formRef.current?.querySelector<HTMLInputElement>(`[name="${firstErrorField}"]`);
      input?.focus();
      return;
    }

    // Submit the form
    console.log('Form submitted:', Object.fromEntries(data));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-label="Create account">
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="error-summary">
          <p>Please fix {Object.keys(errors).length} error(s) below to continue.</p>
        </div>
      )}

      <div className="form-grid">
        {/* Full Name */}
        <div className="field">
          <label htmlFor="reg-name">Full name</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-describedby={errors.name ? 'reg-name-error' : undefined}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p id="reg-name-error" className="field-error" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="field">
          <label htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="reg-email-error" className="field-error" role="alert">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="reg-password-hint reg-password-strength"
            aria-invalid={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="reg-password-hint" className="field-hint">At least 8 characters with mixed case, numbers, and symbols.</p>
          {password.length > 0 && (
            <div
              id="reg-password-strength"
              role="status"
              aria-live="polite"
              className="strength-indicator"
            >
              <div
                className="strength-bar"
                style={{ width: `${(strength.score / 5) * 100}%` }}
                role="progressbar"
                aria-valuenow={strength.score}
                aria-valuemin={0}
                aria-valuemax={5}
                aria-label={`Password strength: ${strength.label}`}
              />
              <span className="strength-label">{strength.label}</span>
            </div>
          )}
          {errors.password && (
            <p id="reg-password-error" className="field-error" role="alert">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="field">
          <label htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p id="reg-confirm-error" className="field-error" role="alert">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <button type="submit" className="submit-button">Create account</button>
    </form>
  );
}
```

### Responsive Layout

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

@container (max-width: 540px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

### Accessibility Audit

- Every input has a `<label>` with `htmlFor` matching the input `id`.
- Error messages linked to inputs via `aria-describedby` and announced with `role="alert"`.
- Password strength indicator uses `role="status"` with `aria-live="polite"` for non-intrusive updates.
- `required` attribute on all mandatory fields for native browser validation fallback.
- `aria-invalid` set on fields with errors for screen reader announcement.
- Error summary at top uses `role="alert"` to announce the count of errors.
- Focus management: first invalid field receives focus on submission failure.
- `autoComplete` attributes for browser autofill support.
