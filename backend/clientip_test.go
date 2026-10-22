package main

import (
	"net/http/httptest"
	"testing"
)

func TestClientIP(t *testing.T) {
	cases := []struct {
		name, env, forwarded, want string
	}{
		{"production uses the last entry", envProduction, "203.0.113.9", "203.0.113.9"},
		{"production ignores spoofed entries", envProduction, "1.2.3.4, 203.0.113.9", "203.0.113.9"},
		{"production without header", envProduction, "", "192.0.2.1"},
		{"production with garbage", envProduction, "1.2.3.4, not-an-ip", "192.0.2.1"},
		{"local ignores the header", envLocal, "203.0.113.9", "192.0.2.1"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/contact", nil)
			req.RemoteAddr = "192.0.2.1:54321"
			if tc.forwarded != "" {
				req.Header.Set("X-Forwarded-For", tc.forwarded)
			}
			if got := clientIPFunc(tc.env)(req); got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}
