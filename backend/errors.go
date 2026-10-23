package main

import (
	"encoding/json"
	"net/http"
)

// Codigos de error que recibe el frontend. El detalle tecnico solo va a los logs.
const (
	codeInvalidJSON          = "INVALID_JSON"
	codeValidationError      = "VALIDATION_ERROR"
	codePayloadTooLarge      = "PAYLOAD_TOO_LARGE"
	codeUnsupportedMediaType = "UNSUPPORTED_MEDIA_TYPE"
	codeRateLimited          = "RATE_LIMITED"
	codeCaptchaFailed        = "CAPTCHA_FAILED"
	codeCaptchaUnavailable   = "CAPTCHA_UNAVAILABLE"
	codeSendFailed           = "SEND_FAILED"
	codeDailyLimitReached    = "DAILY_LIMIT_REACHED"
	codeOriginNotAllowed     = "ORIGIN_NOT_ALLOWED"
	codeNotFound             = "NOT_FOUND"
	codeMethodNotAllowed     = "METHOD_NOT_ALLOWED"
)

type errorBody struct {
	Code      string            `json:"code"`
	Fields    map[string]string `json:"fields,omitempty"`
	RequestID string            `json:"requestId"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, r *http.Request, status int, code string, fields map[string]string) {
	info := requestInfoFrom(r.Context())
	info.Code = code
	writeJSON(w, status, map[string]errorBody{
		"error": {Code: code, Fields: fields, RequestID: info.ID},
	})
}

func writeOK(w http.ResponseWriter, r *http.Request, outcome string) {
	requestInfoFrom(r.Context()).Code = outcome
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
