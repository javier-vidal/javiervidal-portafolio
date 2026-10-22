package main

import (
	"sync"
	"time"
)

// rateLimiter permite un numero de peticiones por IP dentro de una ventana fija.
// Vive en memoria, por eso Cloud Run debe tener una sola instancia.
type rateLimiter struct {
	mu        sync.Mutex
	limit     int
	window    time.Duration
	now       func() time.Time
	clients   map[string]*clientWindow
	lastSweep time.Time
}

type clientWindow struct {
	start time.Time
	count int
}

func newRateLimiter(limit int, window time.Duration, now func() time.Time) *rateLimiter {
	return &rateLimiter{
		limit:     limit,
		window:    window,
		now:       now,
		clients:   map[string]*clientWindow{},
		lastSweep: now(),
	}
}

// allow registra un intento y dice si se acepta; si no, cuanto falta para reintentar.
func (l *rateLimiter) allow(ip string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	l.sweep(now)

	client, ok := l.clients[ip]
	if !ok || now.Sub(client.start) >= l.window {
		l.clients[ip] = &clientWindow{start: now, count: 1}
		return true, 0
	}
	if client.count >= l.limit {
		return false, client.start.Add(l.window).Sub(now)
	}
	client.count++
	return true, 0
}

// sweep borra ventanas vencidas para que el mapa no crezca sin limite.
func (l *rateLimiter) sweep(now time.Time) {
	if now.Sub(l.lastSweep) < l.window {
		return
	}
	for ip, client := range l.clients {
		if now.Sub(client.start) >= l.window {
			delete(l.clients, ip)
		}
	}
	l.lastSweep = now
}
