package main

import (
	"strings"
	"testing"
)

func envFrom(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestLoadConfigDefaults(t *testing.T) {
	cfg, err := loadConfig(envFrom(map[string]string{"TURNSTILE_SECRET_KEY": "1x0000000000000000000000000000000AA"}))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Port != "8090" || cfg.Env != envLocal || cfg.ContactTo != "dev@javiervidal.cl" {
		t.Errorf("unexpected defaults: %+v", cfg)
	}
	if len(cfg.AllowedOrigins) != 2 {
		t.Errorf("got origins %v", cfg.AllowedOrigins)
	}
}

func TestLoadConfigErrors(t *testing.T) {
	cases := []struct {
		name string
		env  map[string]string
		want string
	}{
		{"missing turnstile key", map[string]string{}, "TURNSTILE_SECRET_KEY is required"},
		{"unknown env", map[string]string{"APP_ENV": "staging", "TURNSTILE_SECRET_KEY": "k"}, "APP_ENV"},
		{"production without resend", map[string]string{"APP_ENV": "production", "TURNSTILE_SECRET_KEY": "real-key"}, "RESEND_API_KEY"},
		{"production with test key", map[string]string{
			"APP_ENV": "production", "RESEND_API_KEY": "re_x", "TURNSTILE_SECRET_KEY": "1x0000000000000000000000000000000AA",
		}, "test key"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := loadConfig(envFrom(tc.env))
			if err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Errorf("got %v, want error containing %q", err, tc.want)
			}
		})
	}
}
