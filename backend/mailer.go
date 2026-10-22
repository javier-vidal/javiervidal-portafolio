package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// emailMessage no tiene destinatario: el mailer siempre envia a la direccion configurada.
// Asi el visitante nunca puede recibir un correo de esta API.
type emailMessage struct {
	Subject string
	Text    string
	ReplyTo string
}

type mailer interface {
	send(ctx context.Context, msg emailMessage) error
}

const resendEndpoint = "https://api.resend.com/emails"

type resendMailer struct {
	apiKey   string
	from     string
	to       string
	endpoint string
	client   *http.Client
}

func newResendMailer(apiKey, from, to string) *resendMailer {
	return &resendMailer{
		apiKey:   apiKey,
		from:     from,
		to:       to,
		endpoint: resendEndpoint,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (m *resendMailer) send(ctx context.Context, msg emailMessage) error {
	payload, err := json.Marshal(map[string]any{
		"from":     m.from,
		"to":       []string{m.to},
		"reply_to": msg.ReplyTo,
		"subject":  msg.Subject,
		"text":     msg.Text,
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, m.endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("resend request: %w", err)
	}
	defer resp.Body.Close()
	// Solo el codigo de estado: la respuesta podria repetir datos del visitante.
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("resend responded with status %d", resp.StatusCode)
	}
	return nil
}

// logMailer se usa en local mientras no haya clave de Resend. No registra el contenido.
type logMailer struct {
	logger *slog.Logger
	to     string
}

func (m *logMailer) send(ctx context.Context, msg emailMessage) error {
	m.logger.Info("mail simulated",
		"request_id", requestInfoFrom(ctx).ID,
		"to", m.to,
		"text_length", len(msg.Text),
	)
	return nil
}
