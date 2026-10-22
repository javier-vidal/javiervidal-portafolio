package main

import "time"

const minFillTime = 3 * time.Second

// isSpam aplica el honeypot y el tiempo minimo de llenado. Devuelve el motivo para el log.
func isSpam(honeypot string, elapsedMs int64) (bool, string) {
	if honeypot != "" {
		return true, "SPAM_HONEYPOT"
	}
	if time.Duration(elapsedMs)*time.Millisecond < minFillTime {
		return true, "SPAM_TOO_FAST"
	}
	return false, ""
}
