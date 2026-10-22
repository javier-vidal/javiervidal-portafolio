package main

import (
	"net"
	"net/http"
	"strings"
)

// clientIPFunc elige como obtener la IP segun el entorno.
// En Cloud Run, su proxy agrega la IP real al final de X-Forwarded-For; las entradas
// anteriores las puede inventar el cliente. En local no hay proxy y se usa la conexion.
func clientIPFunc(env string) func(*http.Request) string {
	if env == envProduction {
		return lastForwardedIP
	}
	return remoteIP
}

func lastForwardedIP(r *http.Request) string {
	header := r.Header.Get("X-Forwarded-For")
	if header == "" {
		return remoteIP(r)
	}
	parts := strings.Split(header, ",")
	if ip := net.ParseIP(strings.TrimSpace(parts[len(parts)-1])); ip != nil {
		return ip.String()
	}
	return remoteIP(r)
}

func remoteIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
