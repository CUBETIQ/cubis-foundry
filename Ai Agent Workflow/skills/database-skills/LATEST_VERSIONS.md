# Database Versions Baseline

Last verified: 2026-02-20 (US)

## Relational / SQL

- PostgreSQL: **18.2** current minor for supported major 18.
- MySQL:
  - **8.4.8** current LTS patch.
  - **9.6.0** latest Innovation release.
- SQLite: **3.51.2** current stable release.
- Vitess: **v23.0.2** current stable patch in v23.0 line.

## Document / KV / Managed

- MongoDB: **8.2.5** latest patch in current 8.2 minor line.
- Redis Open Source: **8.4.0** latest GA major (8.2 remains an actively documented line).
- Supabase Postgres:
  - Managed projects may run **Postgres 17**.
  - Self-hosted Docker docs currently call out **Postgres 15** compatibility constraints.
- Neki: announced and in active development/waitlist stage (no GA semantic version yet).

## Source links (official)

- PostgreSQL versioning: https://www.postgresql.org/support/versioning/
- MySQL release model: https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html
- MySQL 8.4.8 LTS notes: https://dev.mysql.com/doc/relnotes/mysql/8.4/en/news-8-4-8.html
- MySQL 9.6.0 Innovation notes: https://dev.mysql.com/doc/relnotes/mysql/9.6/en/news-9-6-0.html
- SQLite current release: https://sqlite.org/releaselog/current.html
- Vitess releases: https://vitess.io/docs/releases/
- MongoDB 8.2 release notes: https://www.mongodb.com/docs/manual/release-notes/8.2/
- Redis 8.4 updates: https://redis.io/docs/latest/develop/whats-new/8-4/
- Redis OSS releases: https://github.com/redis/redis/releases
- Supabase restore compatibility note: https://supabase.com/docs/guides/self-hosting/restore-from-platform
- Neki announcement: https://planetscale.com/blog/announcing-neki
- Neki product page: https://planetscale.com/neki
