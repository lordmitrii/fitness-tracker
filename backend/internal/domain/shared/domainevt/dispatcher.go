package domainevt

import (
	"context"
	"sync"
)

type Handler func(ctx context.Context, e Event) error

type Dispatcher struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

func NewDispatcher() *Dispatcher {
	return &Dispatcher{
		handlers: make(map[string][]Handler),
	}
}

func (d *Dispatcher) Register(eventType string, h Handler) {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.handlers[eventType] = append(d.handlers[eventType], h)
}

func (d *Dispatcher) Dispatch(ctx context.Context, events []Event) error {
	d.mu.RLock()
	defer d.mu.RUnlock()

	for _, e := range events {
		hs := d.handlers[e.EventType()]
		for _, h := range hs {
			if err := h(ctx, e); err != nil {
				return err
			}
		}
	}

	return nil
}
