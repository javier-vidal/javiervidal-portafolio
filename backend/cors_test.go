package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCORS(t *testing.T) {
	env := newTestEnv()

	t.Run("preflight from allowed origin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/contact", nil)
		req.Header.Set("Origin", "https://javiervidal.cl")
		req.Header.Set("Access-Control-Request-Method", "POST")
		rec := httptest.NewRecorder()
		env.router.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("got %d, want 204", rec.Code)
		}
		if rec.Header().Get("Access-Control-Allow-Origin") != "https://javiervidal.cl" {
			t.Error("missing Access-Control-Allow-Origin")
		}
		if rec.Header().Get("Access-Control-Allow-Methods") != "POST" {
			t.Error("missing Access-Control-Allow-Methods")
		}
	})

	t.Run("post from allowed origin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/contact", strings.NewReader(`{}`))
		req.Header.Set("Origin", "http://localhost:4210")
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		env.router.ServeHTTP(rec, req)

		if rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost:4210" {
			t.Error("missing Access-Control-Allow-Origin")
		}
	})

	t.Run("other origins are rejected", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/contact", nil)
		req.Header.Set("Origin", "https://evil.example")
		req.Header.Set("Access-Control-Request-Method", "POST")
		rec := httptest.NewRecorder()
		env.router.ServeHTTP(rec, req)

		if rec.Code != http.StatusForbidden || errorCode(t, rec).Code != codeOriginNotAllowed {
			t.Fatalf("got %d, want 403 ORIGIN_NOT_ALLOWED", rec.Code)
		}
		if rec.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Error("must not send Access-Control-Allow-Origin to other origins")
		}
	})
}
