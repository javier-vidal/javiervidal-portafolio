package main

import (
	"net/mail"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

const (
	nameMinLen    = 2
	nameMaxLen    = 100
	emailMaxLen   = 254
	messageMinLen = 10
	messageMaxLen = 5000
)

// Detecta etiquetas como <b>, </p> o <!--, pero permite textos como "a < b".
var htmlTag = regexp.MustCompile(`<[a-zA-Z/!?]`)

type contactInput struct {
	Name    string
	Email   string
	Message string
}

// validateContact limpia los campos y devuelve un mapa campo -> motivo si algo no cumple.
func validateContact(in contactInput) (contactInput, map[string]string) {
	out := contactInput{
		Name:    strings.TrimSpace(in.Name),
		Email:   strings.TrimSpace(in.Email),
		Message: strings.TrimSpace(in.Message),
	}
	fields := map[string]string{}

	if reason := checkText(out.Name, nameMinLen, nameMaxLen, false); reason != "" {
		fields["name"] = reason
	}
	if reason := checkText(out.Message, messageMinLen, messageMaxLen, true); reason != "" {
		fields["message"] = reason
	}
	switch {
	case out.Email == "":
		fields["email"] = "required"
	case utf8.RuneCountInString(out.Email) > emailMaxLen:
		fields["email"] = "too_long"
	case !isPlainEmail(out.Email):
		fields["email"] = "invalid"
	}

	if len(fields) > 0 {
		return contactInput{}, fields
	}
	return out, nil
}

func checkText(value string, minLen, maxLen int, allowNewlines bool) string {
	length := utf8.RuneCountInString(value)
	switch {
	case length == 0:
		return "required"
	case !utf8.ValidString(value) || hasControlChars(value, allowNewlines):
		return "invalid"
	case length < minLen:
		return "too_short"
	case length > maxLen:
		return "too_long"
	case htmlTag.MatchString(value):
		return "html_not_allowed"
	}
	return ""
}

// Los saltos de linea solo se permiten en el mensaje; en el nombre podrian inyectar cabeceras.
func hasControlChars(value string, allowNewlines bool) bool {
	for _, r := range value {
		if allowNewlines && (r == '\n' || r == '\r' || r == '\t') {
			continue
		}
		if unicode.IsControl(r) {
			return true
		}
	}
	return false
}

// isPlainEmail acepta solo "usuario@dominio", sin nombre ni signos < >.
func isPlainEmail(value string) bool {
	addr, err := mail.ParseAddress(value)
	if err != nil || addr.Address != value || addr.Name != "" {
		return false
	}
	at := strings.LastIndex(value, "@")
	return at > 0 && strings.Contains(value[at+1:], ".")
}
