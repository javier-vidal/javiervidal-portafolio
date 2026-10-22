package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"
)

type captchaVerifier interface {
	// verify devuelve false si el token no es valido, y error si no se pudo verificar.
	verify(ctx context.Context, token, remoteIP string) (bool, error)
}

const turnstileEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type turnstileVerifier struct {
	secret   string
	endpoint string
	client   *http.Client
}

func newTurnstileVerifier(secret string) *turnstileVerifier {
	return &turnstileVerifier{
		secret:   secret,
		endpoint: turnstileEndpoint,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

type siteverifyResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

func (v *turnstileVerifier) verify(ctx context.Context, token, remoteIP string) (bool, error) {
	form := url.Values{"secret": {v.secret}, "response": {token}, "remoteip": {remoteIP}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := v.client.Do(req)
	if err != nil {
		return false, fmt.Errorf("siteverify request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("siteverify responded with status %d", resp.StatusCode)
	}

	var result siteverifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("siteverify response: %w", err)
	}
	// Una clave secreta mala es un error de configuracion, no culpa del visitante.
	for _, code := range []string{"missing-input-secret", "invalid-input-secret"} {
		if slices.Contains(result.ErrorCodes, code) {
			return false, fmt.Errorf("siteverify rejected the secret key: %s", code)
		}
	}
	return result.Success, nil
}
