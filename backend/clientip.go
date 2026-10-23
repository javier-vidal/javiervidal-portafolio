package main

import (
	"net"
	"net/http"
	"strings"
)

// clientIPFunc elige como obtener la IP segun el entorno.
// En Render todo el trafico pasa por Cloudflare, que escribe CF-Connecting-IP en cada
// peticion y reemplaza cualquier valor que mande el cliente. X-Forwarded-For no sirve:
// Cloudflare agrega al final y deja intacto lo que el cliente haya inventado.
// En local no hay proxy y se usa la conexion.
func clientIPFunc(env string) func(*http.Request) string {
	if env == envProduction {
		return cloudflareIP
	}
	return remoteIP
}

// Si falta la cabecera (por ejemplo, el health check interno de Render) se usa la
// conexion. Nunca se recurre a X-Forwarded-For, que el cliente puede falsificar.
func cloudflareIP(r *http.Request) string {
	if ip := net.ParseIP(strings.TrimSpace(r.Header.Get("CF-Connecting-IP"))); ip != nil {
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
