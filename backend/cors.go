package main

import (
	"net/http"
	"slices"
)

// withCORS solo deja pasar navegadores desde los origenes permitidos.
// Las peticiones sin Origin (curl, servidores) no vienen de un navegador y siguen de largo.
func withCORS(allowed []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Add("Vary", "Origin")
		if !slices.Contains(allowed, origin) {
			writeError(w, r, http.StatusForbidden, codeOriginNotAllowed, nil)
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Expose-Headers", "X-Request-Id, Retry-After")

		// Consulta previa que hace el navegador antes del POST con JSON.
		if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
			w.Header().Set("Access-Control-Allow-Methods", "POST")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Max-Age", "600")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
