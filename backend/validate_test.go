package main

import (
	"strings"
	"testing"
)

func TestValidateContact(t *testing.T) {
	valid := contactInput{Name: "Ana Perez", Email: "ana@example.com", Message: "Hola, quiero conversar."}

	cases := []struct {
		name      string
		change    func(*contactInput)
		wantField string
		wantError string
	}{
		{"valid", func(*contactInput) {}, "", ""},
		{"message with newlines", func(c *contactInput) { c.Message = "Hola,\nquiero conversar.\n\nSaludos" }, "", ""},
		{"comparison is not html", func(c *contactInput) { c.Message = "Si 3 < 5 entonces todo bien." }, "", ""},
		{"empty name", func(c *contactInput) { c.Name = "" }, "name", "required"},
		{"short name", func(c *contactInput) { c.Name = "A" }, "name", "too_short"},
		{"long name", func(c *contactInput) { c.Name = strings.Repeat("a", nameMaxLen+1) }, "name", "too_long"},
		{"newline in name", func(c *contactInput) { c.Name = "Ana\nBcc: x@y.com" }, "name", "invalid"},
		{"html in name", func(c *contactInput) { c.Name = "<b>Ana</b>" }, "name", "html_not_allowed"},
		{"empty email", func(c *contactInput) { c.Email = " " }, "email", "required"},
		{"email without domain", func(c *contactInput) { c.Email = "ana@" }, "email", "invalid"},
		{"email without dot", func(c *contactInput) { c.Email = "ana@localhost" }, "email", "invalid"},
		{"email with display name", func(c *contactInput) { c.Email = "Ana <ana@example.com>" }, "email", "invalid"},
		{"long email", func(c *contactInput) { c.Email = strings.Repeat("a", 250) + "@x.cl" }, "email", "too_long"},
		{"short message", func(c *contactInput) { c.Message = "Hola" }, "message", "too_short"},
		{"long message", func(c *contactInput) { c.Message = strings.Repeat("a", messageMaxLen+1) }, "message", "too_long"},
		{"html comment", func(c *contactInput) { c.Message = "Hola <!-- oculto --> mundo" }, "message", "html_not_allowed"},
		{"control char", func(c *contactInput) { c.Message = "Hola\x00 quiero conversar" }, "message", "invalid"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			in := valid
			tc.change(&in)
			out, fields := validateContact(in)
			if tc.wantField == "" {
				if fields != nil {
					t.Fatalf("unexpected errors: %v", fields)
				}
				if out.Name != strings.TrimSpace(in.Name) {
					t.Errorf("name was not trimmed: %q", out.Name)
				}
				return
			}
			if fields[tc.wantField] != tc.wantError {
				t.Errorf("got %v, want %s=%s", fields, tc.wantField, tc.wantError)
			}
		})
	}
}
