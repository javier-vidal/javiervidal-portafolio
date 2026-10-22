package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math"
	"mime"
	"net/http"
	"strconv"
	"strings"
)

const maxBodyBytes = 16 << 10

type contactRequest struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Message        string `json:"message"`
	Website        string `json:"website"`
	ElapsedMs      int64  `json:"elapsedMs"`
	TurnstileToken string `json:"turnstileToken"`
}

type contactHandler struct {
	limiter  *rateLimiter
	verifier captchaVerifier
	mailer   mailer
	clientIP func(*http.Request) string
	logger   *slog.Logger
}

func (h *contactHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ip := h.clientIP(r)
	if ok, retryAfter := h.limiter.allow(ip); !ok {
		w.Header().Set("Retry-After", strconv.Itoa(int(math.Ceil(retryAfter.Seconds()))))
		writeError(w, r, http.StatusTooManyRequests, codeRateLimited, nil)
		return
	}

	if mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type")); err != nil || mediaType != "application/json" {
		writeError(w, r, http.StatusUnsupportedMediaType, codeUnsupportedMediaType, nil)
		return
	}

	var req contactRequest
	if status, code := decodeJSON(w, r, &req); code != "" {
		writeError(w, r, status, code, nil)
		return
	}

	// Al spam se le responde como si todo saliera bien, para no darle pistas.
	if spam, reason := isSpam(req.Website, req.ElapsedMs); spam {
		writeOK(w, r, reason)
		return
	}

	input, fields := validateContact(contactInput{Name: req.Name, Email: req.Email, Message: req.Message})
	if fields != nil {
		writeError(w, r, http.StatusBadRequest, codeValidationError, fields)
		return
	}

	if strings.TrimSpace(req.TurnstileToken) == "" {
		writeError(w, r, http.StatusForbidden, codeCaptchaFailed, nil)
		return
	}
	valid, err := h.verifier.verify(r.Context(), req.TurnstileToken, ip)
	if err != nil {
		h.logError(r, "captcha verification failed", err)
		writeError(w, r, http.StatusBadGateway, codeCaptchaUnavailable, nil)
		return
	}
	if !valid {
		writeError(w, r, http.StatusForbidden, codeCaptchaFailed, nil)
		return
	}

	msg := emailMessage{
		Subject: "Nuevo mensaje del portafolio de " + input.Name,
		Text:    fmt.Sprintf("Nombre: %s\nCorreo: %s\n\n%s\n", input.Name, input.Email, input.Message),
		ReplyTo: input.Email,
	}
	if err := h.mailer.send(r.Context(), msg); err != nil {
		h.logError(r, "send failed", err)
		writeError(w, r, http.StatusBadGateway, codeSendFailed, nil)
		return
	}
	writeOK(w, r, "SENT")
}

// decodeJSON acepta un solo objeto JSON, sin campos desconocidos y con tamano maximo.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) (int, string) {
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			return http.StatusRequestEntityTooLarge, codePayloadTooLarge
		}
		return http.StatusBadRequest, codeInvalidJSON
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return http.StatusBadRequest, codeInvalidJSON
	}
	return 0, ""
}

// Los errores de Resend y Turnstile solo contienen codigos de estado, nunca datos del visitante.
func (h *contactHandler) logError(r *http.Request, message string, err error) {
	h.logger.Error(message, "request_id", requestInfoFrom(r.Context()).ID, "error", err.Error())
}
