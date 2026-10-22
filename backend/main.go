package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const (
	contactLimit  = 5
	contactWindow = 10 * time.Minute
)

func main() {
	logger := newLogger(os.Stdout)

	cfg, err := loadConfig(os.Getenv)
	if err != nil {
		logger.Error("startup failed", "error", err.Error())
		os.Exit(1)
	}

	var m mailer = newResendMailer(cfg.ResendAPIKey, cfg.ContactFrom, cfg.ContactTo)
	if cfg.ResendAPIKey == "" {
		logger.Warn("RESEND_API_KEY not set, emails will only be logged")
		m = &logMailer{logger: logger, to: cfg.ContactTo}
	}

	contact := &contactHandler{
		limiter:  newRateLimiter(contactLimit, contactWindow, time.Now),
		verifier: newTurnstileVerifier(cfg.TurnstileSecretKey),
		mailer:   m,
		clientIP: clientIPFunc(cfg.Env),
		logger:   logger,
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           newRouter(cfg, contact, logger),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Cloud Run envia SIGTERM antes de detener el contenedor.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("listening", "port", cfg.Port, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err.Error())
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown failed", "error", err.Error())
	}
	logger.Info("stopped")
}

func newRouter(cfg Config, contact http.Handler, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("POST /api/contact", contact)
	mux.HandleFunc("/api/contact", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Allow", "POST")
		writeError(w, r, http.StatusMethodNotAllowed, codeMethodNotAllowed, nil)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, r, http.StatusNotFound, codeNotFound, nil)
	})
	return withRequestLog(logger, withCORS(cfg.AllowedOrigins, mux))
}
