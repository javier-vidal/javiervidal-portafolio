package main

import (
	"errors"
	"net/http"
	"testing"
	"time"
)

func TestDailyCap(t *testing.T) {
	clock := &fakeClock{current: time.Date(2026, 10, 23, 8, 0, 0, 0, time.UTC)}
	daily := newDailyCap(40, clock.now)

	for i := range 40 {
		if !daily.reserve() {
			t.Fatalf("message %d should fit in the daily cap", i+1)
		}
	}
	if daily.reserve() {
		t.Fatal("message 41 must be rejected")
	}

	daily.release()
	if !daily.reserve() {
		t.Error("a released slot must be available again")
	}

	clock.advance(15*time.Hour + 59*time.Minute)
	if daily.reserve() {
		t.Error("23:59 UTC is still the same day")
	}

	clock.advance(time.Minute)
	if !daily.reserve() {
		t.Error("the cap must reset at 00:00 UTC")
	}
}

func TestDailyCapNeverGoesNegative(t *testing.T) {
	clock := &fakeClock{current: time.Date(2026, 10, 23, 8, 0, 0, 0, time.UTC)}
	daily := newDailyCap(1, clock.now)
	daily.release()
	daily.release()
	if !daily.reserve() || daily.reserve() {
		t.Error("extra releases must not create more than the limit")
	}
}

func TestContactDailyLimitReached(t *testing.T) {
	env := newTestEnv()
	env.daily.limit = 1

	if rec := env.postJSON(t, validBody()); rec.Code != http.StatusOK {
		t.Fatalf("first message: got %d", rec.Code)
	}
	rec := env.postJSON(t, validBody())
	if rec.Code != http.StatusTooManyRequests || errorCode(t, rec).Code != codeDailyLimitReached {
		t.Fatalf("got %d %s, want 429 DAILY_LIMIT_REACHED", rec.Code, rec.Body.String())
	}
	if env.verifier.calls != 1 || len(env.mailer.sent) != 1 {
		t.Error("once the cap is reached, neither Turnstile nor the mailer must be called")
	}
}

func TestContactFailuresDoNotUseTheDailyCap(t *testing.T) {
	cases := map[string]func(*testEnv){
		"invalid captcha": func(e *testEnv) { e.verifier.valid = false },
		"captcha down":    func(e *testEnv) { e.verifier.err = errors.New("timeout") },
		"mail failed":     func(e *testEnv) { e.mailer.err = errors.New("status 500") },
	}
	for name, breakIt := range cases {
		t.Run(name, func(t *testing.T) {
			env := newTestEnv()
			env.daily.limit = 1
			breakIt(env)
			if rec := env.postJSON(t, validBody()); rec.Code == http.StatusOK {
				t.Fatal("expected the first attempt to fail")
			}

			*env.verifier = fakeVerifier{valid: true}
			env.mailer.err = nil
			if rec := env.postJSON(t, validBody()); rec.Code != http.StatusOK {
				t.Errorf("the failed attempt must not use the only slot, got %d", rec.Code)
			}
		})
	}
}

func TestSpamDoesNotUseTheDailyCap(t *testing.T) {
	env := newTestEnv()
	env.daily.limit = 1
	spam := validBody()
	spam["website"] = "https://spam.example"
	env.postJSON(t, spam)

	if rec := env.postJSON(t, validBody()); rec.Code != http.StatusOK {
		t.Errorf("spam must not use the daily cap, got %d", rec.Code)
	}
}
