package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTurnstileVerifier(t *testing.T) {
	cases := []struct {
		name      string
		response  string
		wantValid bool
		wantErr   bool
	}{
		{"valid token", `{"success":true}`, true, false},
		{"invalid token", `{"success":false,"error-codes":["invalid-input-response"]}`, false, false},
		{"bad secret is a config error", `{"success":false,"error-codes":["invalid-input-secret"]}`, false, true},
		{"broken response", `not json`, false, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var form map[string]string
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_ = r.ParseForm()
				form = map[string]string{"secret": r.FormValue("secret"), "response": r.FormValue("response"), "remoteip": r.FormValue("remoteip")}
				_, _ = w.Write([]byte(tc.response))
			}))
			defer server.Close()

			v := newTurnstileVerifier("secret-key")
			v.endpoint = server.URL
			valid, err := v.verify(context.Background(), "token-123", "203.0.113.9")

			if valid != tc.wantValid || (err != nil) != tc.wantErr {
				t.Fatalf("got valid=%v err=%v", valid, err)
			}
			if form["secret"] != "secret-key" || form["response"] != "token-123" || form["remoteip"] != "203.0.113.9" {
				t.Errorf("unexpected form sent to siteverify: %v", form)
			}
		})
	}
}

func TestTurnstileVerifierServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	v := newTurnstileVerifier("secret-key")
	v.endpoint = server.URL
	if _, err := v.verify(context.Background(), "token", "203.0.113.9"); err == nil {
		t.Fatal("expected an error when siteverify is down")
	}
}
