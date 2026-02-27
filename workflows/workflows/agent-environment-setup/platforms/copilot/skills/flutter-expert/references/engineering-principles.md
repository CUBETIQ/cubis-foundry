# Engineering Principles

## Core Principles

### SOLID

- **S**ingle Responsibility: One reason to change per class/module
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for base types
- **I**nterface Segregation: Many specific interfaces > one general interface
- **D**ependency Inversion: Depend on abstractions, not concretions

### KISS — Keep It Simple

- Prefer straightforward solutions over clever ones
- If it's hard to explain, it's probably too complex
- Complexity is the enemy of reliability

### DRY — Don't Repeat Yourself

- Extract shared logic into reusable functions/modules
- Single source of truth for business rules
- But: don't over-abstract prematurely (see YAGNI)

### YAGNI — You Aren't Gonna Need It

- Build only what's needed now
- No speculative features or "just in case" code
- Requirements change; premature abstraction wastes effort

### Separation of Concerns

- Each module handles one aspect of functionality
- UI, business logic, data access in separate layers
- Clear boundaries between packages

### Dependency Inversion

- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Inject dependencies, don't instantiate them

### Explicit > Implicit

- Favor explicit configuration over magic
- Clear naming over clever shortcuts
- Readable code over terse code

### Fail Fast

- Validate inputs at boundaries
- Throw early on invalid state
- Don't silently swallow errors

### Boring Architecture Wins

- Proven patterns over trendy solutions
- Standard libraries over custom implementations
- Maintainability over cleverness

---

## Applying These Principles

### When Writing Code

1. Ask: "Does this class/function do one thing?"
2. Ask: "Is this the simplest solution that works?"
3. Ask: "Am I building something I actually need right now?"
4. Ask: "Would a new team member understand this?"

### When Reviewing Code

- Flag violations of these principles
- Suggest simpler alternatives
- Question speculative features

### When Designing

- Start simple, add complexity only when proven necessary
- Prefer composition over inheritance
- Design for change, but don't over-engineer
