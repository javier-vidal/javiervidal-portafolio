package main

import (
	"sync"
	"time"
)

// dailyCap limita cuantos mensajes se envian por dia en total, sin importar la IP.
// Vive en memoria y el dia se cuenta en UTC: se reinicia a las 00:00 UTC.
type dailyCap struct {
	mu    sync.Mutex
	limit int
	now   func() time.Time
	day   string
	used  int
}

func newDailyCap(limit int, now func() time.Time) *dailyCap {
	return &dailyCap{limit: limit, now: now}
}

// reserve aparta un cupo antes de enviar; devuelve false si el tope del dia ya se alcanzo.
func (c *dailyCap) reserve() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.rollover()
	if c.used >= c.limit {
		return false
	}
	c.used++
	return true
}

// release devuelve el cupo cuando el envio no llego a hacerse.
func (c *dailyCap) release() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.rollover()
	if c.used > 0 {
		c.used--
	}
}

func (c *dailyCap) rollover() {
	if today := c.now().UTC().Format(time.DateOnly); today != c.day {
		c.day = today
		c.used = 0
	}
}
