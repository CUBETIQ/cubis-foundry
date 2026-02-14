# Review Checklist

> Reference for: Code Reviewer
> Load when: Starting a code review

## Comprehensive Review Checklist

| Category           | Key Questions                                                |
| ------------------ | ------------------------------------------------------------ |
| **Design**         | Does it fit existing patterns? Right abstraction level?      |
| **Logic**          | Edge cases handled? Race conditions? Null checks?            |
| **Security**       | Input validated? Auth checked? Secrets safe?                 |
| **Performance**    | N+1 queries? Memory leaks? Caching needed?                   |
| **Tests**          | Adequate coverage? Edge cases tested? Mocks appropriate?     |
| **Naming**         | Clear, consistent, intention-revealing? File names standard? |
| **Error Handling** | Errors caught? Meaningful messages? Logged?                  |
| **Documentation**  | Public APIs documented? Complex logic explained?             |
| **Code Smells**    | Dead code? Duplication? God objects? Divergent change?       |

## Review Process

### 1. Context (5 min)

- [ ] Read PR description
- [ ] Understand the problem being solved
- [ ] Check linked issues/tickets
- [ ] Note expected changes
- [ ] Enforce strict rules in strict-rules.md

### 2. Structure (10 min)

- [ ] Review file organization
- [ ] Check architectural fit
- [ ] Verify design patterns used
- [ ] Note any breaking changes

### 3. Code Details (20 min)

- [ ] Review logic correctness
- [ ] Check edge cases
- [ ] Verify error handling
- [ ] Look for security issues
- [ ] Check performance concerns
- [ ] Review naming clarity
- [ ] Flag code smells and unnecessary code
- [ ] Check for race conditions and unsafe concurrency

### 4. Tests (10 min)

- [ ] Verify test coverage
- [ ] Check test quality
- [ ] Look for edge case tests
- [ ] Ensure mocks are appropriate

### 5. Final Pass (5 min)

- [ ] Note positive patterns
- [ ] Prioritize feedback
- [ ] Write summary

## Category Deep Dive

### Design Questions

- Does this change belong in this file/module?
- Is the abstraction level appropriate?
- Could this be simpler?
- Does it follow existing patterns?
- Is it extensible without modification?
- Does it follow SOLID where relevant?
- Is the solution KISS/YAGNI (not over-engineered)?

### Design Principles Quick Check

- **SOLID**: SRP, OCP, LSP, ISP, DIP where applicable
- **KISS**: simplest working solution
- **DRY**: no duplicated logic or configs
- **YAGNI**: avoid speculative features
- **Separation of Concerns**: clear boundaries between layers
- **Composition over Inheritance**: favor small composable units

### Logic Questions

- What happens with null/undefined inputs?
- Are boundary conditions handled?
- Could there be race conditions?
- Is the order of operations correct?
- Are all code paths tested?

### Security Questions

- Is all user input validated?
- Are SQL queries parameterized?
- Is output properly encoded?
- Are secrets handled safely?
- Is authentication checked?
- Is authorization enforced?

### Performance Questions

- Are there N+1 query patterns?
- Is data fetched efficiently?
- Are expensive operations cached?
- Could this cause memory leaks?
- Is pagination implemented?

### Naming & Organization Questions

- Are file names consistent with repo conventions?
- Do file names describe responsibility clearly?
- Are functions named with verbs and intent?
- Are variables descriptive and scoped tightly?
- Is there one primary concern per file?

### Code Smell Questions

- Is there duplicate logic that can be extracted (DRY)?
- Is there dead/unused code?
- Are there long functions/classes with mixed responsibilities (SRP)?
- Are there “god” objects or utility dumping grounds?
- Are there hidden side-effects or global state dependencies?

## Quick Reference

| Review Focus             | Time % |
| ------------------------ | ------ |
| Context & PR description | 10%    |
| Architecture & design    | 20%    |
| Code logic & details     | 40%    |
| Tests & coverage         | 20%    |
| Final review & summary   | 10%    |


