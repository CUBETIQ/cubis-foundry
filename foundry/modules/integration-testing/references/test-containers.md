# Test Containers

## Overview

Testcontainers is a library that provides lightweight, disposable Docker containers for integration testing. Instead of mocking databases, message brokers, or caches, you run real instances in containers that start and stop with your test suite.

## Supported Infrastructure

| Category | Containers Available |
|----------|---------------------|
| Databases | PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Elasticsearch, CockroachDB, Cassandra |
| Message Brokers | RabbitMQ, Kafka, Pulsar, NATS, ActiveMQ |
| Cloud Emulators | LocalStack (AWS), GCP Emulators, Azure Storage Emulator |
| Caches | Redis, Memcached, Hazelcast |
| Search | Elasticsearch, OpenSearch, Solr |
| Other | Nginx, Vault, Keycloak, MinIO, MailHog |

## Basic Usage

### JavaScript/TypeScript

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Database Integration', () => {
  let container;
  let connectionUri;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .withExposedPorts(5432)
      .start();

    connectionUri = container.getConnectionUri();
  }, 60_000);

  afterAll(async () => {
    await container.stop();
  });

  test('connects and queries', async () => {
    const pool = new Pool({ connectionString: connectionUri });
    const result = await pool.query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
    await pool.end();
  });
});
```

### Python

```python
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="module")
def postgres():
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres

@pytest.fixture
def connection(postgres):
    conn = psycopg2.connect(postgres.get_connection_url())
    yield conn
    conn.close()

def test_query(connection):
    cursor = connection.cursor()
    cursor.execute("SELECT 1 as value")
    assert cursor.fetchone()[0] == 1
```

### Java

```java
@Testcontainers
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb");

    @Test
    void shouldFindUser() {
        DataSource ds = createDataSource(postgres.getJdbcUrl(),
            postgres.getUsername(), postgres.getPassword());
        UserRepository repo = new UserRepository(ds);

        User user = repo.findById(1L);
        assertNotNull(user);
    }
}
```

## Advanced Configuration

### Custom Docker Images

When you need database extensions, custom configurations, or pre-loaded data:

```typescript
const container = await new GenericContainer('my-registry/postgres-postgis:16')
  .withExposedPorts(5432)
  .withEnvironment({
    POSTGRES_DB: 'testdb',
    POSTGRES_USER: 'testuser',
    POSTGRES_PASSWORD: 'testpass',
  })
  .withCopyFilesToContainer([
    { source: './init.sql', target: '/docker-entrypoint-initdb.d/init.sql' },
  ])
  .start();
```

### Network Configuration

Connect multiple containers on a shared network:

```typescript
const network = await new Network().start();

const postgres = await new PostgreSqlContainer()
  .withNetwork(network)
  .withNetworkAliases('db')
  .start();

const app = await new GenericContainer('my-app:latest')
  .withNetwork(network)
  .withEnvironment({ DATABASE_URL: 'postgresql://testuser:testpass@db:5432/testdb' })
  .withExposedPorts(3000)
  .start();
```

### Wait Strategies

Ensure the container is fully ready before tests begin:

```typescript
const container = await new GenericContainer('custom-service:latest')
  .withExposedPorts(8080)
  .withWaitStrategy(
    Wait.forHttp('/health', 8080)
      .forStatusCode(200)
      .withStartupTimeout(30_000)
  )
  .start();
```

Available strategies:
- `Wait.forListeningPorts()` -- Default. Waits for exposed ports to accept connections.
- `Wait.forHttp(path, port)` -- Waits for an HTTP endpoint to return a specific status.
- `Wait.forLogMessage(regex)` -- Waits for a log line matching the pattern.
- `Wait.forHealthCheck()` -- Waits for Docker healthcheck to pass.

## Performance Optimization

### Container Reuse

Reuse containers across test runs during local development:

```typescript
const container = await new PostgreSqlContainer()
  .withReuse()  // Keeps container running between test runs
  .start();
```

**Warning:** Do not use reuse in CI. CI runs must start clean.

### Parallel Test Suites

Each parallel test suite gets its own container:

```
Suite A: PostgreSqlContainer (port 32768)
Suite B: PostgreSqlContainer (port 32769)
Suite C: PostgreSqlContainer (port 32770)
```

Testcontainers assigns random host ports automatically, so parallel suites never conflict.

### Image Pulling

Pre-pull images in CI setup to avoid timeout during test execution:

```yaml
# GitHub Actions
- name: Pull test container images
  run: |
    docker pull postgres:16-alpine
    docker pull redis:7-alpine
    docker pull rabbitmq:3-management-alpine
```

## Docker Compose Integration

For complex multi-container setups, use Docker Compose files:

```typescript
import { DockerComposeEnvironment } from 'testcontainers';

const environment = await new DockerComposeEnvironment('.', 'docker-compose.test.yml')
  .withWaitStrategy('postgres', Wait.forHealthCheck())
  .withWaitStrategy('redis', Wait.forListeningPorts())
  .up();

const postgresHost = environment.getContainer('postgres').getHost();
const postgresPort = environment.getContainer('postgres').getMappedPort(5432);
```

## CI Configuration

### GitHub Actions

```yaml
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration
        env:
          TESTCONTAINERS_RYUK_DISABLED: 'false'
          DOCKER_HOST: unix:///var/run/docker.sock
```

### GitLab CI

```yaml
integration-tests:
  image: node:20
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
    TESTCONTAINERS_HOST_OVERRIDE: docker
  script:
    - npm ci
    - npm run test:integration
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Container fails to start | Port conflict or image not found | Check Docker is running, verify image name |
| Tests timeout in CI | Slow image pull or insufficient resources | Pre-pull images, increase CI runner resources |
| Connection refused | Tests start before container is ready | Add explicit wait strategy |
| Out of disk space | Containers not cleaned up | Enable Ryuk (container reaper) or add manual cleanup |
| Flaky connection errors | Container IP changes between tests | Use `container.getHost()` and `container.getMappedPort()` |

## Ryuk: Automatic Cleanup

Testcontainers runs a "Ryuk" sidecar container that automatically removes test containers when the JVM/Node process exits, even if tests crash. This prevents orphaned containers from accumulating.

```
Test Process starts -> Ryuk starts
Test Process runs   -> Containers created
Test Process exits  -> Ryuk removes all containers
Test Process crashes -> Ryuk still removes containers (after timeout)
```

Never disable Ryuk in CI unless you have an alternative cleanup mechanism.
