# Example: Async Worker with Structured Concurrency

## Scenario

Build an async message-processing worker that reads from a queue, processes messages with bounded concurrency, and shuts down gracefully on SIGTERM.

## Implementation

```python
"""Async worker with TaskGroup-based structured concurrency."""

import asyncio
import signal
import logging
from dataclasses import dataclass, field
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog

logger = structlog.get_logger()


# --- Domain types ---

@dataclass(frozen=True, slots=True)
class Message:
    id: str
    payload: bytes
    retry_count: int = 0


@dataclass(frozen=True, slots=True)
class ProcessingResult:
    message_id: str
    success: bool
    error: str | None = None


class ProcessingError(Exception):
    """Base error for message processing failures."""

class RetryableError(ProcessingError):
    """Error that should trigger a retry."""

class PoisonMessageError(ProcessingError):
    """Error for messages that should be dead-lettered."""


# --- Resource management ---

@dataclass
class WorkerConfig:
    concurrency: int = 10
    max_retries: int = 3
    shutdown_timeout: float = 30.0


class MessageQueue:
    """Async message queue abstraction."""

    async def receive(self) -> Message | None:
        """Receive next message, or None if queue is empty."""
        ...

    async def acknowledge(self, message_id: str) -> None:
        ...

    async def reject(self, message_id: str, requeue: bool) -> None:
        ...


class ResultStore:
    """Async result persistence."""

    async def save(self, result: ProcessingResult) -> None:
        ...


# --- Worker ---

class Worker:
    def __init__(
        self,
        queue: MessageQueue,
        store: ResultStore,
        config: WorkerConfig | None = None,
    ) -> None:
        self._queue = queue
        self._store = store
        self._config = config or WorkerConfig()
        self._shutdown_event = asyncio.Event()
        self._semaphore = asyncio.Semaphore(self._config.concurrency)

    def request_shutdown(self) -> None:
        """Signal all workers to drain and stop."""
        logger.info("shutdown_requested")
        self._shutdown_event.set()

    async def _process_one(self, message: Message) -> ProcessingResult:
        """Process a single message with error handling."""
        log = logger.bind(message_id=message.id, retry=message.retry_count)
        try:
            # --- Your processing logic here ---
            log.info("processing_message")
            await asyncio.sleep(0.1)  # Simulate work
            return ProcessingResult(message_id=message.id, success=True)

        except RetryableError as exc:
            if message.retry_count < self._config.max_retries:
                log.warning("retryable_error", error=str(exc))
                await self._queue.reject(message.id, requeue=True)
                return ProcessingResult(
                    message_id=message.id, success=False, error=str(exc)
                )
            log.error("max_retries_exceeded", error=str(exc))
            return ProcessingResult(
                message_id=message.id, success=False, error=f"max retries: {exc}"
            )

        except PoisonMessageError as exc:
            log.error("poison_message", error=str(exc))
            await self._queue.reject(message.id, requeue=False)
            return ProcessingResult(
                message_id=message.id, success=False, error=str(exc)
            )

    async def _worker_loop(self, worker_id: int) -> None:
        """Single worker loop: receive, process, ack/reject."""
        log = logger.bind(worker_id=worker_id)
        log.info("worker_started")

        while not self._shutdown_event.is_set():
            async with self._semaphore:
                message = await self._queue.receive()
                if message is None:
                    await asyncio.sleep(0.5)
                    continue

                result = await self._process_one(message)
                await self._store.save(result)

                if result.success:
                    await self._queue.acknowledge(message.id)

        log.info("worker_stopped")

    async def run(self) -> None:
        """Run the worker pool with structured concurrency."""
        # Register signal handlers
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self.request_shutdown)

        logger.info(
            "worker_pool_starting",
            concurrency=self._config.concurrency,
        )

        try:
            async with asyncio.TaskGroup() as tg:
                for i in range(self._config.concurrency):
                    tg.create_task(self._worker_loop(i))

                # Wait for shutdown signal
                await self._shutdown_event.wait()

                # TaskGroup will wait for all workers to finish
                # because they check shutdown_event in their loop
                logger.info("draining_workers")

        except* ProcessingError as eg:
            logger.error("worker_pool_error", errors=[str(e) for e in eg.exceptions])

        logger.info("worker_pool_stopped")


# --- Entry point ---

async def main() -> None:
    queue = MessageQueue()
    store = ResultStore()
    config = WorkerConfig(concurrency=5, max_retries=3, shutdown_timeout=30.0)

    worker = Worker(queue, store, config)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

## Key Patterns

1. **`asyncio.TaskGroup`** manages all worker coroutines — if one crashes, all siblings are cancelled.
2. **`asyncio.Event`** for shutdown signaling — signal handlers set the event, worker loops check it.
3. **`asyncio.Semaphore`** bounds concurrency independently of the number of workers.
4. **Exception hierarchy** — `RetryableError` vs `PoisonMessageError` enables different error recovery strategies.
5. **`structlog` with bound context** — every log entry carries `worker_id` and `message_id` for tracing.
6. **`except*` (ExceptionGroup)** — catches multiple errors from TaskGroup without losing any.
