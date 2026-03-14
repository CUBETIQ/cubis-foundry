# Example: Concurrent Data Fetcher with errgroup

## Scenario

Build a service that fetches data from multiple upstream APIs concurrently, respects timeouts at both the per-request and overall levels, and returns a combined result or the first error.

## Implementation

```go
package fetcher

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

// --- Types ---

type APIResult struct {
	Source string
	Data   json.RawMessage
}

type AggregatedResult struct {
	Results  []APIResult
	Duration time.Duration
}

// --- Service ---

// Fetcher retrieves data from multiple upstream APIs concurrently.
// It is safe to call from multiple goroutines.
type Fetcher struct {
	client     *http.Client
	endpoints  map[string]string // name -> URL
	perReqTTL  time.Duration
	logger     *slog.Logger
}

func NewFetcher(
	endpoints map[string]string,
	perRequestTimeout time.Duration,
	logger *slog.Logger,
) *Fetcher {
	return &Fetcher{
		client: &http.Client{
			// Do not set Timeout here; we control it via context per request
		},
		endpoints: endpoints,
		perReqTTL: perRequestTimeout,
		logger:    logger,
	}
}

// FetchAll retrieves data from all configured endpoints concurrently.
// It cancels remaining requests if any single fetch fails.
// The parent context should carry the overall deadline.
func (f *Fetcher) FetchAll(ctx context.Context) (*AggregatedResult, error) {
	start := time.Now()

	// errgroup.WithContext derives a context that is cancelled when any
	// goroutine returns an error. This is the cancellation mechanism.
	g, gctx := errgroup.WithContext(ctx)

	var mu sync.Mutex
	results := make([]APIResult, 0, len(f.endpoints))

	for name, url := range f.endpoints {
		// Capture loop variables for the goroutine closure.
		name, url := name, url

		g.Go(func() error {
			result, err := f.fetchOne(gctx, name, url)
			if err != nil {
				return fmt.Errorf("fetch %s: %w", name, err)
			}

			mu.Lock()
			results = append(results, *result)
			mu.Unlock()

			return nil
		})
	}

	// Wait blocks until all goroutines finish or one returns an error.
	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &AggregatedResult{
		Results:  results,
		Duration: time.Since(start),
	}, nil
}

func (f *Fetcher) fetchOne(ctx context.Context, name, url string) (*APIResult, error) {
	// Per-request timeout layered on top of the group context.
	// If the group context is cancelled (sibling error), this also cancels.
	reqCtx, cancel := context.WithTimeout(ctx, f.perReqTTL)
	defer cancel()

	log := f.logger.With("source", name, "url", url)
	log.InfoContext(reqCtx, "fetching_upstream")

	start := time.Now()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	var data json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	log.InfoContext(reqCtx, "fetch_complete",
		"status", resp.StatusCode,
		"duration_ms", time.Since(start).Milliseconds(),
	)

	return &APIResult{Source: name, Data: data}, nil
}

// --- Usage ---

func Example() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	logger := slog.Default()

	f := NewFetcher(
		map[string]string{
			"users":    "https://api.example.com/users",
			"products": "https://api.example.com/products",
			"orders":   "https://api.example.com/orders",
		},
		3*time.Second, // per-request timeout
		logger,
	)

	result, err := f.FetchAll(ctx)
	if err != nil {
		logger.Error("fetch_all_failed", "error", err)
		return
	}

	logger.Info("fetch_all_complete",
		"count", len(result.Results),
		"duration_ms", result.Duration.Milliseconds(),
	)
}
```

## Key Patterns

1. **`errgroup.WithContext`** — creates a derived context that cancels when any goroutine errors.
2. **Per-request `context.WithTimeout`** — each fetch has its own 3s timeout inside the group's 10s overall deadline.
3. **`fmt.Errorf("fetch %s: %w", name, err)`** — wraps errors with context for the chain.
4. **`sync.Mutex`** guards the results slice — simpler than a channel for collecting a known number of results.
5. **`slog.With`** for structured logging with source attribution.
