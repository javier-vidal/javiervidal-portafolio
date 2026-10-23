package main

import (
	"net/http/httptest"
	"testing"
)

func TestClientIP(t *testing.T) {
	cases := []struct {
		name, env, cfConnectingIP, forwardedFor, want string
	}{
		{"production uses CF-Connecting-IP", envProduction, "203.0.113.9", "", "203.0.113.9"},
		{"production supports IPv6", envProduction, "2001:db8::1", "", "2001:db8::1"},
		{"production ignores a spoofed X-Forwarded-For", envProduction, "203.0.113.9", "1.2.3.4, 203.0.113.9", "203.0.113.9"},
		{"production never trusts X-Forwarded-For alone", envProduction, "", "1.2.3.4", "192.0.2.1"},
		{"production with garbage header", envProduction, "not-an-ip", "", "192.0.2.1"},
		{"local ignores proxy headers", envLocal, "203.0.113.9", "203.0.113.9", "192.0.2.1"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/contact", nil)
			req.RemoteAddr = "192.0.2.1:54321"
			if tc.cfConnectingIP != "" {
				req.Header.Set("CF-Connecting-IP", tc.cfConnectingIP)
			}
			if tc.forwardedFor != "" {
				req.Header.Set("X-Forwarded-For", tc.forwardedFor)
			}
			if got := clientIPFunc(tc.env)(req); got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}
