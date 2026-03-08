# Architecture Overview Template

Use this file to describe system boundaries and data flow.

## Components

- API layer
- Domain/service layer
- Persistence layer
- External integrations

## Runtime Flow

1. Request enters API layer
2. Domain logic validates and processes
3. Persistence reads/writes state
4. Response returns with observability metadata

## Non-Functional Notes

- Reliability/SLOs
- Security model
- Scaling strategy
