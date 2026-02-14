# Testing Next.js Applications

## Testing Stack

| Tool                      | Purpose                             |
| ------------------------- | ----------------------------------- |
| Jest / Vitest             | Unit tests, component tests         |
| React Testing Library     | Component rendering and interaction |
| Playwright                | E2E tests on real browsers          |
| MSW (Mock Service Worker) | API mocking                         |

## Project Setup

### Vitest + React Testing Library

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

### Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Unit Testing

### Testing Utility Functions

```tsx
// lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatPrice, slugify } from "./utils";

describe("formatPrice", () => {
  it("should format cents to dollars", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("should handle zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });
});

describe("slugify", () => {
  it("should convert to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello & World!")).toBe("hello-world");
  });
});
```

### Testing Server Actions

```tsx
// app/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { createPost } from "./actions";

vi.mock("@/lib/db", () => ({
  db: {
    post: {
      create: vi.fn().mockResolvedValue({ id: "1", title: "Test" }),
    },
  },
}));

describe("createPost", () => {
  it("should create a post with valid data", async () => {
    const formData = new FormData();
    formData.set("title", "Test Post");
    formData.set("content", "Test content");

    const result = await createPost({}, formData);
    expect(result.success).toBe(true);
  });

  it("should return errors for invalid data", async () => {
    const formData = new FormData();
    formData.set("title", ""); // Empty title

    const result = await createPost({}, formData);
    expect(result.errors?.title).toBeDefined();
  });
});
```

## Component Testing

### Testing Server Components

```tsx
// components/ProductCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  const product = {
    id: "1",
    name: "Test Product",
    price: 29.99,
    image: "/test.jpg",
  };

  it("should render product name and price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("should render product image with alt text", () => {
    render(<ProductCard product={product} />);
    const img = screen.getByAltText("Test Product");
    expect(img).toBeInTheDocument();
  });
});
```

### Testing Client Components with Interactions

```tsx
// components/Counter.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("should increment on click", () => {
    render(<Counter initialCount={0} />);

    const button = screen.getByRole("button", { name: /increment/i });
    fireEvent.click(button);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should decrement on click", () => {
    render(<Counter initialCount={5} />);

    const button = screen.getByRole("button", { name: /decrement/i });
    fireEvent.click(button);

    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
```

## E2E Testing with Playwright

### Basic Navigation Test

```tsx
// e2e/navigation.spec.ts
import { test, expect } from "@playwright/test";

test("should navigate to about page", async ({ page }) => {
  await page.goto("/");
  await page.click("text=About");
  await expect(page).toHaveURL("/about");
  await expect(page.locator("h1")).toContainText("About");
});
```

### Form Submission Test

```tsx
// e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test("should submit contact form", async ({ page }) => {
  await page.goto("/contact");

  await page.fill('[name="name"]', "John Doe");
  await page.fill('[name="email"]', "john@example.com");
  await page.fill('[name="message"]', "Hello!");
  await page.click('button[type="submit"]');

  await expect(page.locator(".success-message")).toBeVisible();
});
```

### Authentication Flow

```tsx
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("nav")).toContainText("Welcome");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "wrong@example.com");
    await page.fill('[name="password"]', "wrong");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error")).toContainText("Invalid credentials");
  });
});
```

### Visual Regression

```tsx
// e2e/visual.spec.ts
import { test, expect } from "@playwright/test";

test("homepage visual regression", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", {
    maxDiffPixelRatio: 0.01,
  });
});
```

## API Mocking with MSW

```tsx
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/products", () => {
    return HttpResponse.json([
      { id: "1", name: "Product 1", price: 19.99 },
      { id: "2", name: "Product 2", price: 29.99 },
    ]);
  }),

  http.post("/api/products", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "3", ...body }, { status: 201 });
  }),
];

// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);

// tests/setup.ts
import { server } from "./mocks/server";
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Running Tests

```bash
# Unit + component tests
npm test
npx vitest --run

# E2E tests
npx playwright test
npx playwright test --ui          # Interactive UI mode
npx playwright test --headed      # See browser
npx playwright show-report        # View HTML report

# Coverage
npx vitest --coverage

# Update snapshots
npx playwright test --update-snapshots
```
