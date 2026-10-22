package main

import (
	"testing"
	"time"
)

// fakeClock permite adelantar el tiempo en las pruebas sin esperar.
type fakeClock struct{ current time.Time }

func (c *fakeClock) now() time.Time          { return c.current }
func (c *fakeClock) advance(d time.Duration) { c.current = c.current.Add(d) }

func TestRateLimiter(t *testing.T) {
	clock := &fakeClock{current: time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC)}
	limiter := newRateLimiter(5, 10*time.Minute, clock.now)

	for i := range 5 {
		if ok, _ := limiter.allow("203.0.113.1"); !ok {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}

	clock.advance(4 * time.Minute)
	ok, retryAfter := limiter.allow("203.0.113.1")
	if ok {
		t.Fatal("6th request should be blocked")
	}
	if retryAfter != 6*time.Minute {
		t.Errorf("got retryAfter %v, want 6m", retryAfter)
	}

	if ok, _ := limiter.allow("198.51.100.7"); !ok {
		t.Error("another IP must have its own counter")
	}

	clock.advance(6 * time.Minute)
	if ok, _ := limiter.allow("203.0.113.1"); !ok {
		t.Error("the window should have reset")
	}
}

func TestRateLimiterSweepsOldEntries(t *testing.T) {
	clock := &fakeClock{current: time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC)}
	limiter := newRateLimiter(5, 10*time.Minute, clock.now)
	limiter.allow("203.0.113.1")
	limiter.allow("203.0.113.2")

	clock.advance(11 * time.Minute)
	limiter.allow("203.0.113.3")

	if len(limiter.clients) != 1 {
		t.Errorf("expected only the new client, got %d entries", len(limiter.clients))
	}
}
