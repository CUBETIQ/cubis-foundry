# Example 01: Rune-Based Todo List with Svelte 5

## Scenario

Build a todo list component using Svelte 5 runes that supports adding, toggling, and filtering todos with derived counts and a persistence side effect.

## Prompt

> Create a Svelte 5 todo list component with add, toggle complete, and delete functionality. Use $state for the todo array, $derived for filtered views and counts, and $effect to persist to localStorage. Include a filter for all/active/completed.

## Expected Output

### `src/lib/components/TodoList.svelte`

```svelte
<script lang="ts">
  type Todo = {
    id: string;
    text: string;
    completed: boolean;
  };

  type Filter = 'all' | 'active' | 'completed';

  let todos = $state<Todo[]>(loadFromStorage());
  let newText = $state('');
  let filter = $state<Filter>('all');

  let filteredTodos = $derived(
    filter === 'all'
      ? todos
      : filter === 'active'
        ? todos.filter((t) => !t.completed)
        : todos.filter((t) => t.completed)
  );

  let activeCount = $derived(todos.filter((t) => !t.completed).length);
  let completedCount = $derived(todos.filter((t) => t.completed).length);

  $effect(() => {
    localStorage.setItem('svelte-todos', JSON.stringify(todos));
  });

  function loadFromStorage(): Todo[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('svelte-todos');
    return stored ? JSON.parse(stored) : [];
  }

  function addTodo() {
    const trimmed = newText.trim();
    if (!trimmed) return;

    todos.push({
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false
    });
    newText = '';
  }

  function toggleTodo(id: string) {
    const todo = todos.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }

  function deleteTodo(id: string) {
    const index = todos.findIndex((t) => t.id === id);
    if (index !== -1) todos.splice(index, 1);
  }
</script>

<div class="todo-app">
  <form onsubmit={(e) => { e.preventDefault(); addTodo(); }}>
    <input
      type="text"
      bind:value={newText}
      placeholder="What needs to be done?"
      aria-label="New todo text"
    />
    <button type="submit">Add</button>
  </form>

  <nav aria-label="Filter todos">
    {#each ['all', 'active', 'completed'] as f}
      <button
        class:active={filter === f}
        onclick={() => filter = f as Filter}
      >
        {f}
      </button>
    {/each}
  </nav>

  <ul>
    {#each filteredTodos as todo (todo.id)}
      <li class:completed={todo.completed}>
        <label>
          <input
            type="checkbox"
            checked={todo.completed}
            onchange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </label>
        <button onclick={() => deleteTodo(todo.id)} aria-label="Delete {todo.text}">
          Delete
        </button>
      </li>
    {/each}
  </ul>

  <footer>
    <span>{activeCount} active</span>
    <span>{completedCount} completed</span>
  </footer>
</div>
```

## Key Patterns Demonstrated

1. **`$state` for mutable arrays** -- Svelte 5 deeply tracks array mutations (`push`, `splice`) on `$state` values, so in-place mutation triggers reactivity without reassignment.

2. **`$derived` for filtered views and counts** -- Both `filteredTodos` and the count values recompute automatically when `todos` or `filter` change. No manual dependency tracking needed.

3. **`$effect` for persistence** -- The effect automatically tracks its dependency on `todos` and writes to localStorage whenever the array changes. No cleanup needed for synchronous storage.

4. **SSR guard in `loadFromStorage`** -- The `typeof window` check prevents `localStorage` access during server-side rendering, which would throw in SvelteKit.

5. **Keyed `#each` block** -- Using `(todo.id)` as the key ensures Svelte correctly reconciles list items during adds, deletes, and reorders.
