package eventbus

import "context"

type Handler func(ctx context.Context, e any) error

type Bus interface {
	Subscribe(eventType string, h Handler)
	Publish(ctx context.Context, events ...any) error
}

type inproc struct{ hs map[string][]Handler }

func NewInproc() Bus { return &inproc{hs: map[string][]Handler{}} }

func (b *inproc) Subscribe(eventType string, h Handler) {
	b.hs[eventType] = append(b.hs[eventType], h)
}

func (b *inproc) Publish(ctx context.Context, events ...any) error {
	for _, ev := range events {
		et, ok := ev.(interface{ EventType() string })
		if !ok {
			continue
		}
		hs := b.hs[et.EventType()]
		for _, h := range hs {
			if err := h(ctx, ev); err != nil {
				// rn its fail fast, can add logging or something later
				return err
			}
		}
	}
	return nil
}
