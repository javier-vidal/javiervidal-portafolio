package main

import (
	"errors"
	"fmt"
	"strings"
)

const (
	envLocal      = "local"
	envProduction = "production"
)

type Config struct {
	Port               string
	Env                string
	ResendAPIKey       string
	TurnstileSecretKey string
	ContactTo          string
	ContactFrom        string
	AllowedOrigins     []string
}

// loadConfig recibe getenv como parametro para poder probarla sin tocar el entorno real.
func loadConfig(getenv func(string) string) (Config, error) {
	get := func(key, fallback string) string {
		if value := strings.TrimSpace(getenv(key)); value != "" {
			return value
		}
		return fallback
	}

	cfg := Config{
		Port:               get("PORT", "8090"),
		Env:                get("APP_ENV", envLocal),
		ResendAPIKey:       get("RESEND_API_KEY", ""),
		TurnstileSecretKey: get("TURNSTILE_SECRET_KEY", ""),
		ContactTo:          get("CONTACT_TO", "dev@javiervidal.cl"),
		ContactFrom:        get("CONTACT_FROM", "Portafolio <contacto@javiervidal.cl>"),
	}
	for _, origin := range strings.Split(get("ALLOWED_ORIGINS", "https://javiervidal.cl,http://localhost:4210"), ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			cfg.AllowedOrigins = append(cfg.AllowedOrigins, origin)
		}
	}

	var problems []string
	if cfg.Env != envLocal && cfg.Env != envProduction {
		problems = append(problems, fmt.Sprintf("APP_ENV must be %q or %q", envLocal, envProduction))
	}
	if cfg.TurnstileSecretKey == "" {
		problems = append(problems, "TURNSTILE_SECRET_KEY is required")
	}
	if cfg.Env == envProduction {
		if cfg.ResendAPIKey == "" {
			problems = append(problems, "RESEND_API_KEY is required in production")
		}
		if isTurnstileTestKey(cfg.TurnstileSecretKey) {
			problems = append(problems, "TURNSTILE_SECRET_KEY cannot be a test key in production")
		}
	}
	if len(problems) > 0 {
		return Config{}, errors.New("invalid config: " + strings.Join(problems, "; "))
	}
	return cfg, nil
}

// Las claves de prueba oficiales de Turnstile empiezan con 1x, 2x o 3x seguido de ceros.
func isTurnstileTestKey(key string) bool {
	return len(key) > 2 && strings.HasPrefix(key[2:], "0000000000") &&
		(strings.HasPrefix(key, "1x") || strings.HasPrefix(key, "2x") || strings.HasPrefix(key, "3x"))
}
