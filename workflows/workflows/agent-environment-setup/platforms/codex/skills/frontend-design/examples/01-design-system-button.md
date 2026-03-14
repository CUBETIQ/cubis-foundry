# Example: Design System Button Component

## Prompt

> Create a Button component for our design system with primary, secondary, ghost, and danger variants. It needs to support sizes sm/md/lg, loading state, disabled state, and leading/trailing icons. Use design tokens and ensure full accessibility.

## Response

### Design Tokens

```css
:root {
  /* Color tokens */
  --color-primary-500: oklch(0.55 0.18 250);
  --color-primary-600: oklch(0.48 0.18 250);
  --color-danger-500: oklch(0.55 0.2 25);
  --color-danger-600: oklch(0.48 0.2 25);
  --color-neutral-100: oklch(0.96 0.005 250);
  --color-neutral-200: oklch(0.92 0.005 250);
  --color-neutral-800: oklch(0.25 0.01 250);
  --color-white: oklch(0.99 0 0);

  /* Spacing tokens */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;

  /* Typography tokens */
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --line-height-tight: 1.25;

  /* Shape tokens */
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;

  /* Motion tokens */
  --duration-fast: 120ms;
  --easing-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Focus tokens */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: oklch(0.55 0.18 250 / 0.5);
}
```

### Component

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      iconLeading,
      iconTrailing,
      children,
      onClick,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]}`}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        onClick={isDisabled ? undefined : onClick}
        {...rest}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          </span>
        )}
        {!loading && iconLeading && (
          <span className={styles.icon} aria-hidden="true">{iconLeading}</span>
        )}
        <span className={styles.label}>{children}</span>
        {!loading && iconTrailing && (
          <span className={styles.icon} aria-hidden="true">{iconTrailing}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Accessibility Notes

- `aria-disabled` communicates disabled state to screen readers.
- `aria-busy` announces loading state to assistive technologies.
- Icon elements use `aria-hidden="true"` so screen readers skip decorative content.
- Focus ring uses `:focus-visible` to appear only on keyboard navigation.
- Color contrast ratios exceed WCAG AA (4.5:1 for all text on all variant backgrounds).

### Usage

```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Save Changes
</Button>

<Button variant="danger" iconLeading={<TrashIcon />} disabled={!canDelete}>
  Delete
</Button>

<Button variant="ghost" size="sm" iconTrailing={<ChevronRightIcon />}>
  View All
</Button>
```
