# Progressive Enhancement

Load this when implementing optimistic UI, useFetcher, useNavigation, pending states, or forms that must work without JavaScript.

## The Progressive Enhancement Model

Remix forms work as standard HTML forms by default. When JavaScript loads, Remix enhances them with client-side navigation, pending UI, and optimistic updates. This means every form works without JavaScript and gets better with it.

### Standard Form (Works Without JS)

```tsx
import { Form } from "@remix-run/react";

// <Form> renders a <form> in HTML. Without JS, it submits normally.
// With JS, Remix intercepts the submission for a client-side navigation.
export default function ContactForm() {
  return (
    <Form method="post" action="/contact">
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </Form>
  );
}
```

## useNavigation for Pending UI

`useNavigation` tracks the state of the current page navigation (not fetcher submissions).

```tsx
import { Form, useNavigation } from "@remix-run/react";

export default function SubmitForm() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";

  return (
    <Form method="post">
      <input name="title" disabled={isSubmitting} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </Form>
  );
}
```

### Navigation States

| State | Meaning |
| --- | --- |
| `idle` | No navigation in progress |
| `submitting` | A form is being submitted (action is running) |
| `loading` | Loaders are running after action completes or after a link click |

### Accessing Pending Form Data

```tsx
const navigation = useNavigation();

// Access the form data being submitted for optimistic UI
if (navigation.state === "submitting") {
  const pendingTitle = navigation.formData?.get("title");
  // Render the pending title optimistically
}
```

## useFetcher for Non-Navigation Mutations

`useFetcher` submits to an action without changing the URL. Use it for inline edits, toggles, and background operations.

```tsx
import { useFetcher } from "@remix-run/react";

function LikeButton({ postId, liked }: { postId: string; liked: boolean }) {
  const fetcher = useFetcher();

  // Optimistic: use pending data if available, fall back to server data
  const optimisticLiked = fetcher.formData
    ? fetcher.formData.get("liked") === "true"
    : liked;

  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="liked" value={String(!optimisticLiked)} />
      <button type="submit" aria-pressed={optimisticLiked}>
        {optimisticLiked ? "Unlike" : "Like"}
      </button>
    </fetcher.Form>
  );
}
```

### Fetcher States

| State | Meaning |
| --- | --- |
| `idle` | No fetcher operation in progress |
| `submitting` | The fetcher is submitting to an action |
| `loading` | The fetcher is revalidating after the action completed |

### Multiple Independent Fetchers

Each `useFetcher()` call creates an independent instance. Multiple fetchers can be in-flight simultaneously without interfering.

```tsx
function TaskList({ tasks }) {
  return tasks.map((task) => <TaskRow key={task.id} task={task} />);
}

function TaskRow({ task }) {
  const fetcher = useFetcher(); // Each row has its own fetcher

  return (
    <fetcher.Form method="post" action="/api/tasks/toggle">
      <input type="hidden" name="taskId" value={task.id} />
      <button>{task.done ? "Undo" : "Complete"}</button>
    </fetcher.Form>
  );
}
```

## useFetcher for Data Loading

`useFetcher` can also load data without navigation, useful for search-as-you-type and comboboxes.

```tsx
function CitySearch() {
  const fetcher = useFetcher<typeof loader>();

  return (
    <div>
      <fetcher.Form method="get" action="/api/cities">
        <input
          name="q"
          type="search"
          onChange={(e) => fetcher.submit(e.currentTarget.form)}
        />
      </fetcher.Form>
      {fetcher.data?.cities.map((city) => (
        <p key={city.id}>{city.name}</p>
      ))}
    </div>
  );
}
```

## Choosing Between Form, useFetcher, and useSubmit

| Use case | Tool | Reason |
| --- | --- | --- |
| Full-page form submission | `<Form>` | Triggers navigation, updates URL, enables back button |
| Inline edit / toggle / like | `useFetcher` | No URL change, no scroll reset, independent state |
| Programmatic submission | `useSubmit` | Form submission from a click handler or effect |
| Search / filter | `<Form method="get">` | Updates URL search params, works with back button |
| Autocomplete / typeahead | `useFetcher` with `GET` | Loads data without URL change or history entry |
