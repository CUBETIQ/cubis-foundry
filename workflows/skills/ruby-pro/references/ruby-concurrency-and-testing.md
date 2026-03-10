# Ruby Concurrency and Testing

## Ractor patterns (Ruby 3.0+)

### Basic Ractor usage

```ruby
# CPU-bound parallel computation
ractors = 4.times.map do |i|
  Ractor.new(i) do |id|
    # Each Ractor has its own isolated memory
    heavy_computation(id)
  end
end

results = ractors.map(&:take) # Collect results
```

- Ractors provide true parallelism by isolating memory between execution contexts.
- Only shareable objects can be sent between Ractors: frozen objects, `Ractor.make_shareable(obj)`.
- Use `Ractor.yield` / `Ractor.receive` for message-passing between Ractors.

### Ractor constraints

| Allowed                          | Not allowed                                   |
| -------------------------------- | --------------------------------------------- |
| Frozen strings, numbers, symbols | Mutable strings, arrays, hashes               |
| `Ractor.make_shareable(obj)`     | Class variables shared across Ractors         |
| `Ractor::MovedObject` transfer   | Global variables (`$stdout` is special-cased) |

- Most gems are NOT Ractor-safe. Test thoroughly before using Ractors with external libraries.
- Prefer Ractors for compute-heavy, isolated work (parsing, image processing, data transformation).

## Fiber and Async patterns

### Fiber-based concurrency

```ruby
require 'async'

Async do |task|
  # I/O-bound concurrent operations
  response1 = task.async { HTTP.get("https://api.example.com/users") }
  response2 = task.async { HTTP.get("https://api.example.com/posts") }

  users = response1.wait
  posts = response2.wait
end
```

- Fibers run on a single thread — no thread-safety concerns for shared state.
- Use the `async` gem for production fiber-based I/O concurrency.
- Ideal for I/O-bound work: HTTP requests, database queries, file operations.
- Not suitable for CPU-bound work — use Ractors or process-based parallelism instead.

### Thread safety primitives

```ruby
mutex = Mutex.new
counter = 0

threads = 10.times.map do
  Thread.new do
    mutex.synchronize { counter += 1 }
  end
end
threads.each(&:join)
```

- Use `Mutex#synchronize` for critical sections. Never call `lock`/`unlock` manually.
- Use `Queue` for thread-safe producer/consumer patterns.
- Use `Monitor` when you need reentrant locking (same thread can re-acquire the lock).
- Prefer `Concurrent::Map` (from concurrent-ruby) over `Hash` with manual locking.

## Background job patterns

### Sidekiq best practices

```ruby
class UserNotificationJob
  include Sidekiq::Job
  sidekiq_options queue: :default, retry: 3

  def perform(user_id, event_type)
    user = User.find(user_id)
    NotificationService.new(user).send(event_type)
  end
end
```

- Pass only primitive arguments (IDs, strings). Never pass ActiveRecord objects — they can't be serialized safely.
- Set explicit retry counts. Use dead-letter queues for permanently failed jobs.
- Keep jobs idempotent — they may run more than once due to retries.
- Use separate queues for different priority levels (`:critical`, `:default`, `:low`).

## Testing strategy

### RSpec structure

```ruby
RSpec.describe UserService do
  describe "#create" do
    subject(:result) { described_class.new(repo:).create(params) }

    let(:repo) { instance_double(UserRepository) }
    let(:params) { { name: "Alice", email: "alice@example.com" } }

    context "with valid params" do
      before { allow(repo).to receive(:save).and_return(user) }
      let(:user) { build(:user, **params) }

      it { is_expected.to be_success }
      it { expect(result.value).to have_attributes(name: "Alice") }
    end

    context "with duplicate email" do
      before { allow(repo).to receive(:save).and_raise(UniqueViolation) }

      it { is_expected.to be_failure }
      it { expect(result.error).to include("already exists") }
    end
  end
end
```

- Use `describe` for the class/method, `context` for scenarios, `it` for assertions.
- Use `instance_double` for strict mocking — fails if the mocked method doesn't exist.
- Use `let` for lazy setup, `let!` for eager setup, `before` for side effects.

### Factory patterns

```ruby
FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    role { :member }

    trait :admin do
      role { :admin }
    end

    trait :with_posts do
      after(:create) do |user|
        create_list(:post, 3, author: user)
      end
    end
  end
end
```

- Use traits for variations instead of separate factories.
- Prefer `build` (in-memory) over `create` (persisted) in unit tests for speed.
- Use `build_stubbed` for the fastest option when persistence behavior isn't under test.

## Gem dependency audit

### Bundler security workflow

```bash
# Check for known vulnerabilities
bundle audit check --update

# List outdated gems (direct dependencies only)
bundle outdated --only-explicit

# Generate dependency graph
bundle viz --format=svg
```

- Run `bundle audit` in CI. Block deploys on critical findings.
- Update gems in small batches: `bundle update gem_name` + run full test suite.
- Review changelogs before major version bumps — breaking changes often affect behavior silently.
- Use `Gemfile` groups (`:development`, `:test`) to keep production dependencies minimal.

### Type checking with Sorbet

```ruby
# typed: strict
extend T::Sig

sig { params(name: String, age: Integer).returns(User) }
def create_user(name, age)
  User.new(name:, age:)
end
```

- Use `typed: strict` for new files, `typed: true` as a minimum for existing files.
- Generate RBI files for gems: `tapioca gem` for type stubs.
- Run `srb tc` in CI alongside tests.
