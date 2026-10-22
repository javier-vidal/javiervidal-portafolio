package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestResendMailer(t *testing.T) {
	var got map[string]any
	var auth string
	resend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		_ = json.NewDecoder(r.Body).Decode(&got)
		w.WriteHeader(http.StatusOK)
	}))
	defer resend.Close()

	m := newResendMailer("re_test", "Portafolio <contacto@javiervidal.cl>", "dev@javiervidal.cl")
	m.endpoint = resend.URL
	err := m.send(context.Background(), emailMessage{Subject: "Asunto", Text: "Texto", ReplyTo: "ana@example.com"})
	if err != nil {
		t.Fatal(err)
	}

	if auth != "Bearer re_test" {
		t.Errorf("got Authorization %q", auth)
	}
	to, _ := got["to"].([]any)
	if len(to) != 1 || to[0] != "dev@javiervidal.cl" {
		t.Errorf("email must go only to the site owner, got to=%v", got["to"])
	}
	if got["reply_to"] != "ana@example.com" || got["from"] != "Portafolio <contacto@javiervidal.cl>" {
		t.Errorf("unexpected payload: %v", got)
	}
}

func TestResendMailerError(t *testing.T) {
	resend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"message":"echo of ana@example.com"}`, http.StatusUnprocessableEntity)
	}))
	defer resend.Close()

	m := newResendMailer("re_test", "from@x.cl", "dev@javiervidal.cl")
	m.endpoint = resend.URL
	err := m.send(context.Background(), emailMessage{ReplyTo: "ana@example.com"})
	if err == nil || !strings.Contains(err.Error(), "422") {
		t.Fatalf("expected a status error, got %v", err)
	}
	if strings.Contains(err.Error(), "ana@example.com") {
		t.Error("error must not include the provider response body")
	}
}

func TestLogMailerDoesNotLogContent(t *testing.T) {
	var logs bytes.Buffer
	m := &logMailer{logger: newLogger(&logs), to: "dev@javiervidal.cl"}
	_ = m.send(context.Background(), emailMessage{Subject: "De Ana", Text: "mensaje privado", ReplyTo: "ana@example.com"})

	for _, secret := range []string{"Ana", "mensaje privado", "ana@example.com"} {
		if strings.Contains(logs.String(), secret) {
			t.Errorf("log contains %q: %s", secret, logs.String())
		}
	}
}
