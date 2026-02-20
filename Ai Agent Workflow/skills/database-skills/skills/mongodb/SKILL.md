---
name: mongodb
description: MongoDB and Mongoose modeling, indexing, query tuning, and transaction guidance.
---

# MongoDB and Mongoose

Load references as needed:
- `references/modeling.md`
- `references/mongoose-nestjs.md`

Key rules:
- Model by access pattern (embed vs reference).
- Use compound indexes for dominant filters/sorts.
- Use transactions only where multi-document invariants require them.
