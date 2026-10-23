package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakeMailer struct {
	sent []emailMessage
	err  error
}

func (f *fakeMailer) send(_ context.Context, msg emailMessage) error {
	if f.err != nil {
		return f.err
	}
	f.sent = append(f.sent, msg)
	return nil
}

type fakeVerifier struct {
	valid bool
	err   error
	calls int
}

func (f *fakeVerifier) verify(_ context.Context, _, _ string) (bool, error) {
	f.calls++
	return f.valid, f.err
}

type testEnv struct {
	router   http.Handler
	mailer   *fakeMailer
	verifier *fakeVerifier
	daily    *dailyCap
	logs     *bytes.Buffer
}

func newTestEnv() *testEnv {
	env := &testEnv{
		mailer:   &fakeMailer{},
		verifier: &fakeVerifier{valid: true},
		daily:    newDailyCap(contactDailyLimit, time.Now),
		logs:     &bytes.Buffer{},
	}
	logger := newLogger(env.logs)
	contact := &contactHandler{
		limiter:  newRateLimiter(contactLimit, contactWindow, time.Now),
		daily:    env.daily,
		verifier: env.verifier,
		mailer:   env.mailer,
		clientIP: remoteIP,
		logger:   logger,
	}
	cfg := Config{AllowedOrigins: []string{"https://javiervidal.cl", "http://localhost:4210"}}
	env.router = newRouter(cfg, contact, logger)
	return env
}

func validBody() map[string]any {
	return map[string]any{
		"name":           "Ana Perez",
		"email":          "ana@example.com",
		"message":        "Hola, me gustaria conversar sobre un proyecto.",
		"website":        "",
		"elapsedMs":      5000,
		"turnstileToken": "XXXX.DUMMY.TOKEN.XXXX",
	}
}

func (e *testEnv) postJSON(t *testing.T, body map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	return e.postRaw(string(raw), "application/json")
}

func (e *testEnv) postRaw(body, contentType string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/contact", strings.NewReader(body))
	req.Header.Set("Content-Type", contentType)
	rec := httptest.NewRecorder()
	e.router.ServeHTTP(rec, req)
	return rec
}

func errorCode(t *testing.T, rec *httptest.ResponseRecorder) errorBody {
	t.Helper()
	var body struct {
		Error errorBody `json:"error"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("response is not an error body: %v", err)
	}
	return body.Error
}

func TestContactSuccess(t *testing.T) {
	env := newTestEnv()
	rec := env.postJSON(t, validBody())

	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != `{"ok":true}` {
		t.Fatalf("got %d %s", rec.Code, rec.Body.String())
	}
	if len(env.mailer.sent) != 1 {
		t.Fatalf("expected 1 email, got %d", len(env.mailer.sent))
	}
	msg := env.mailer.sent[0]
	if msg.ReplyTo != "ana@example.com" || !strings.Contains(msg.Text, "proyecto") {
		t.Errorf("unexpected message: %+v", msg)
	}
	if rec.Header().Get("X-Request-Id") == "" {
		t.Error("missing X-Request-Id header")
	}
}

func TestContactNeverLogsVisitorData(t *testing.T) {
	env := newTestEnv()
	env.postJSON(t, validBody())
	bad := validBody()
	bad["email"] = "ana-sin-arroba"
	env.postJSON(t, bad)

	logs := env.logs.String()
	for _, secret := range []string{"Ana Perez", "ana@example.com", "ana-sin-arroba", "conversar sobre un proyecto"} {
		if strings.Contains(logs, secret) {
			t.Errorf("logs contain visitor data %q:\n%s", secret, logs)
		}
	}
	if !strings.Contains(logs, `"code":"SENT"`) || !strings.Contains(logs, `"request_id"`) {
		t.Errorf("logs are missing metadata:\n%s", logs)
	}
}

func TestContactSpamGetsFakeSuccess(t *testing.T) {
	cases := map[string]func(map[string]any){
		"honeypot filled": func(b map[string]any) { b["website"] = "https://spam.example" },
		"too fast":        func(b map[string]any) { b["elapsedMs"] = 1200 },
		"no elapsed time": func(b map[string]any) { delete(b, "elapsedMs") },
	}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			env := newTestEnv()
			body := validBody()
			mutate(body)
			rec := env.postJSON(t, body)
			if rec.Code != http.StatusOK {
				t.Fatalf("got %d, want 200", rec.Code)
			}
			if len(env.mailer.sent) != 0 || env.verifier.calls != 0 {
				t.Error("spam must not reach the verifier or the mailer")
			}
		})
	}
}

func TestContactErrors(t *testing.T) {
	cases := []struct {
		name       string
		setup      func(*testEnv)
		mutate     func(map[string]any)
		wantStatus int
		wantCode   string
		wantField  string
	}{
		{name: "invalid email", mutate: func(b map[string]any) { b["email"] = "ana@" },
			wantStatus: 400, wantCode: codeValidationError, wantField: "email"},
		{name: "html in message", mutate: func(b map[string]any) { b["message"] = "Hola <script>alert(1)</script>" },
			wantStatus: 400, wantCode: codeValidationError, wantField: "message"},
		{name: "missing name", mutate: func(b map[string]any) { b["name"] = "  " },
			wantStatus: 400, wantCode: codeValidationError, wantField: "name"},
		{name: "unknown field", mutate: func(b map[string]any) { b["phone"] = "123" },
			wantStatus: 400, wantCode: codeInvalidJSON},
		{name: "missing captcha token", mutate: func(b map[string]any) { delete(b, "turnstileToken") },
			wantStatus: 403, wantCode: codeCaptchaFailed},
		{name: "invalid captcha token", setup: func(e *testEnv) { e.verifier.valid = false },
			wantStatus: 403, wantCode: codeCaptchaFailed},
		{name: "captcha service down", setup: func(e *testEnv) { e.verifier.err = errors.New("timeout") },
			wantStatus: 502, wantCode: codeCaptchaUnavailable},
		{name: "mail provider down", setup: func(e *testEnv) { e.mailer.err = errors.New("status 500") },
			wantStatus: 502, wantCode: codeSendFailed},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			env := newTestEnv()
			if tc.setup != nil {
				tc.setup(env)
			}
			body := validBody()
			if tc.mutate != nil {
				tc.mutate(body)
			}
			rec := env.postJSON(t, body)
			if rec.Code != tc.wantStatus {
				t.Fatalf("got status %d, want %d (%s)", rec.Code, tc.wantStatus, rec.Body.String())
			}
			got := errorCode(t, rec)
			if got.Code != tc.wantCode {
				t.Errorf("got code %q, want %q", got.Code, tc.wantCode)
			}
			if tc.wantField != "" && got.Fields[tc.wantField] == "" {
				t.Errorf("expected an error for field %q, got %v", tc.wantField, got.Fields)
			}
			if got.RequestID == "" {
				t.Error("error body must include requestId")
			}
		})
	}
}

func TestContactRejectsBadPayloads(t *testing.T) {
	cases := []struct {
		name, body, contentType string
		wantStatus              int
		wantCode                string
	}{
		{"not json content type", "name=Ana", "application/x-www-form-urlencoded", 415, codeUnsupportedMediaType},
		{"malformed json", `{"name":`, "application/json", 400, codeInvalidJSON},
		{"two json objects", `{} {}`, "application/json", 400, codeInvalidJSON},
		{"too large", `{"message":"` + strings.Repeat("a", maxBodyBytes) + `"}`, "application/json", 413, codePayloadTooLarge},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := newTestEnv().postRaw(tc.body, tc.contentType)
			if rec.Code != tc.wantStatus || errorCode(t, rec).Code != tc.wantCode {
				t.Errorf("got %d %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestContactRateLimit(t *testing.T) {
	env := newTestEnv()
	for i := range contactLimit {
		if rec := env.postJSON(t, validBody()); rec.Code != http.StatusOK {
			t.Fatalf("request %d: got %d", i+1, rec.Code)
		}
	}
	rec := env.postJSON(t, validBody())
	if rec.Code != http.StatusTooManyRequests || errorCode(t, rec).Code != codeRateLimited {
		t.Fatalf("got %d, want 429 RATE_LIMITED", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "600" {
		t.Errorf("got Retry-After %q, want 600", rec.Header().Get("Retry-After"))
	}
}

func TestRouterErrors(t *testing.T) {
	env := newTestEnv()
	cases := []struct {
		method, path string
		wantStatus   int
		wantCode     string
	}{
		{http.MethodGet, "/api/contact", 405, codeMethodNotAllowed},
		{http.MethodGet, "/", 404, codeNotFound},
		{http.MethodPost, "/api/otra", 404, codeNotFound},
	}
	for _, tc := range cases {
		rec := httptest.NewRecorder()
		env.router.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))
		if rec.Code != tc.wantStatus || errorCode(t, rec).Code != tc.wantCode {
			t.Errorf("%s %s: got %d", tc.method, tc.path, rec.Code)
		}
	}
}

func TestHealth(t *testing.T) {
	env := newTestEnv()
	for range contactLimit + 3 {
		rec := httptest.NewRecorder()
		env.router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, healthPath, nil))
		if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != `{"status":"ok"}` {
			t.Fatalf("got %d %s", rec.Code, rec.Body.String())
		}
	}

	if rec := env.postJSON(t, validBody()); rec.Code != http.StatusOK {
		t.Errorf("health checks must not count toward the rate limit, got %d", rec.Code)
	}
	if env.verifier.calls != 1 || len(env.mailer.sent) != 1 {
		t.Error("health checks must not call external services")
	}
	if strings.Contains(env.logs.String(), healthPath) {
		t.Errorf("health checks must not be logged:\n%s", env.logs.String())
	}

	rec := httptest.NewRecorder()
	env.router.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, healthPath, nil))
	if rec.Code != http.StatusMethodNotAllowed || errorCode(t, rec).Code != codeMethodNotAllowed {
		t.Errorf("POST %s: got %d, want 405", healthPath, rec.Code)
	}
}
