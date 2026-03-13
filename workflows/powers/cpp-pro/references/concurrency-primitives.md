# Concurrency Primitives

## `std::jthread` and `std::stop_token`

```cpp
#include <thread>
#include <stop_token>

// jthread — cooperative cancellation + auto-join
void worker(std::stop_token stoken) {
    while (!stoken.stop_requested()) {
        process_next_item();
    }
    // Clean up when stop is requested
}

{
    std::jthread t(worker); // starts thread
    // ... do work ...
} // jthread destructor: requests stop, then joins — no leak

// Stop callback — register actions on cancellation
void monitored_worker(std::stop_token stoken) {
    std::stop_callback callback(stoken, [] {
        std::cout << "Stop requested, cleaning up...\n";
    });

    while (!stoken.stop_requested()) {
        do_work();
    }
}
```

## Mutex Strategies

```cpp
#include <mutex>
#include <shared_mutex>

// scoped_lock — locks multiple mutexes without deadlock
std::mutex m1, m2;
{
    std::scoped_lock lock(m1, m2); // deadlock-free multi-lock
    // ... access resources protected by both mutexes
} // automatically unlocked

// shared_mutex — multiple readers, single writer
class ThreadSafeMap {
    mutable std::shared_mutex mutex_;
    std::unordered_map<std::string, int> data_;

public:
    int read(const std::string& key) const {
        std::shared_lock lock(mutex_); // concurrent reads allowed
        auto it = data_.find(key);
        return it != data_.end() ? it->second : 0;
    }

    void write(const std::string& key, int value) {
        std::unique_lock lock(mutex_); // exclusive write access
        data_[key] = value;
    }
};

// NEVER use lock/unlock manually — always use RAII guards
// WRONG: m.lock(); ... m.unlock(); // exception-unsafe
// RIGHT: std::lock_guard lock(m); or std::unique_lock lock(m);
```

## Atomic Operations

```cpp
#include <atomic>

// Lock-free counters and flags
class Stats {
    std::atomic<uint64_t> requests_{0};
    std::atomic<uint64_t> errors_{0};
    std::atomic<bool> healthy_{true};

public:
    void record_request() {
        requests_.fetch_add(1, std::memory_order_relaxed);
    }

    void record_error() {
        errors_.fetch_add(1, std::memory_order_relaxed);
    }

    uint64_t requests() const {
        return requests_.load(std::memory_order_relaxed);
    }
};

// Memory ordering guide
// relaxed:  no ordering guarantees, fastest — counters, flags
// acquire:  reads see writes that happened before the matching release
// release:  writes are visible to subsequent acquire loads
// seq_cst:  total order across all threads — default, safest, slowest

// Compare-and-swap for lock-free data structures
std::atomic<Node*> head{nullptr};

void push(Node* node) {
    node->next = head.load(std::memory_order_relaxed);
    while (!head.compare_exchange_weak(
        node->next, node,
        std::memory_order_release,
        std::memory_order_relaxed)) {
        // retry if another thread modified head
    }
}
```

## Condition Variables

```cpp
#include <condition_variable>

class BoundedQueue {
    std::queue<int> queue_;
    std::mutex mutex_;
    std::condition_variable not_empty_;
    std::condition_variable not_full_;
    size_t max_size_;

public:
    explicit BoundedQueue(size_t max) : max_size_(max) {}

    void push(int value) {
        std::unique_lock lock(mutex_);
        not_full_.wait(lock, [this] { return queue_.size() < max_size_; });
        queue_.push(value);
        not_empty_.notify_one();
    }

    int pop() {
        std::unique_lock lock(mutex_);
        not_empty_.wait(lock, [this] { return !queue_.empty(); });
        int value = queue_.front();
        queue_.pop();
        not_full_.notify_one();
        return value;
    }
};
```

## `std::latch` and `std::barrier` (C++20)

```cpp
#include <latch>
#include <barrier>

// Latch — one-time synchronization point
void parallel_init(size_t num_workers) {
    std::latch ready(num_workers);

    auto worker = [&ready](int id) {
        initialize(id);
        ready.count_down();   // signal ready
    };

    std::vector<std::jthread> threads;
    for (size_t i = 0; i < num_workers; ++i) {
        threads.emplace_back(worker, i);
    }

    ready.wait(); // wait until all workers initialized
    start_processing();
}

// Barrier — reusable synchronization point
void iterative_computation(size_t workers, size_t iterations) {
    std::barrier sync(workers, [] noexcept {
        // completion function — runs once per phase after all arrive
        merge_results();
    });

    auto worker = [&sync, iterations](int id) {
        for (size_t i = 0; i < iterations; ++i) {
            compute_partial(id);
            sync.arrive_and_wait(); // sync between iterations
        }
    };
}
```

## Async and Futures

```cpp
#include <future>

// std::async for fire-and-forget computation
auto future = std::async(std::launch::async, [] {
    return expensive_computation();
});
// ... do other work ...
auto result = future.get(); // blocks until ready

// packaged_task for deferred execution
std::packaged_task<int(int)> task([](int x) { return x * x; });
auto future = task.get_future();
std::jthread t(std::move(task), 42); // execute in thread
int result = future.get();

// std::promise for hand-off between threads
std::promise<int> promise;
auto future = promise.get_future();

std::jthread t([&promise] {
    try {
        int result = compute();
        promise.set_value(result);
    } catch (...) {
        promise.set_exception(std::current_exception());
    }
});

int result = future.get(); // may throw if set_exception was called
```

## C++20 Coroutines Basics

```cpp
#include <coroutine>

// Generator coroutine
template<typename T>
struct Generator {
    struct promise_type {
        T current_value;
        auto yield_value(T value) {
            current_value = value;
            return std::suspend_always{};
        }
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        auto initial_suspend() { return std::suspend_always{}; }
        auto final_suspend() noexcept { return std::suspend_always{}; }
        void return_void() {}
        void unhandled_exception() { throw; }
    };

    std::coroutine_handle<promise_type> handle_;

    bool next() {
        handle_.resume();
        return !handle_.done();
    }

    T value() const { return handle_.promise().current_value; }
    ~Generator() { if (handle_) handle_.destroy(); }
};

// Usage
Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto next = a + b;
        a = b;
        b = next;
    }
}
```
