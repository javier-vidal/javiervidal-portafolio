package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// newLogger escribe una linea JSON por evento; Render muestra la salida estandar en sus logs.
func newLogger(out io.Writer) *slog.Logger {
	return slog.New(slog.NewJSONHandler(out, nil))
}

// requestInfo acompana a cada peticion; los handlers anotan el resultado en Code.
type requestInfo struct {
	ID   string
	Code string
}

type requestInfoKey struct{}

func requestInfoFrom(ctx context.Context) *requestInfo {
	if info, ok := ctx.Value(requestInfoKey{}).(*requestInfo); ok {
		return info
	}
	return &requestInfo{}
}

func newRequestID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(status int) {
	s.status = status
	s.ResponseWriter.WriteHeader(status)
}

// withRequestLog registra una linea por peticion, solo con metadatos.
// El health check se omite porque Render lo llama cada pocos segundos.
func withRequestLog(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == healthPath {
			next.ServeHTTP(w, r)
			return
		}
		start := time.Now()
		info := &requestInfo{ID: newRequestID()}
		w.Header().Set("X-Request-Id", info.ID)
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r.WithContext(context.WithValue(r.Context(), requestInfoKey{}, info)))

		level := slog.LevelInfo
		if rec.status >= 500 {
			level = slog.LevelError
		} else if rec.status >= 400 {
			level = slog.LevelWarn
		}
		logger.Log(r.Context(), level, "request",
			"request_id", info.ID,
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"code", info.Code,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}
