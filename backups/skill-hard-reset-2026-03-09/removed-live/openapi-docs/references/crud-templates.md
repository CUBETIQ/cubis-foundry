# CRUD Templates (Create / Update / Delete)

## Create (POST)

- `summary`: Create <resource>
- `request.body`:
  - `application/json` schema with required fields
  - example payload
- Responses:
  - `201` with created resource schema
  - `400` validation error
  - `401` missing auth
  - `403` forbidden
  - `500` server error

## Update (PUT/PATCH)

- `summary`: Update <resource>
- `request.params`: `{ id }`
- `request.body`: optional fields for update
- Responses:
  - `200` with updated resource schema
  - `400` validation error
  - `401` missing auth
  - `403` forbidden
  - `404` not found
  - `500` server error

## Delete (DELETE)

- `summary`: Delete <resource>
- `request.params`: `{ id }`
- Responses:
  - `204` no content (or `200` with confirmation schema)
  - `401` missing auth
  - `403` forbidden
  - `404` not found
  - `500` server error

## Notes

- Ensure `request.headers` includes all required auth headers
- Use shared `ErrorResponse` schema for errors
