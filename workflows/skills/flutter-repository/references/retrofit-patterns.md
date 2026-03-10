# Retrofit Patterns

## DTO Rules

- DTOs mirror the wire contract.
- Use explicit JSON keys when backend naming differs.
- Keep DTOs separate from domain models.

## API Interface Rules

- Keep the interface thin and transport-oriented.
- Return typed DTOs, not raw maps, when the shape is known.
- Keep auth, base URL, and interceptors outside the generated interface.

## Repository Rules

- Reads return local data first.
- Remote refresh populates local storage.
- Writes persist locally, enqueue sync work, and return early.
- Mappers convert DTOs to companions/domain types instead of building them inline everywhere.
