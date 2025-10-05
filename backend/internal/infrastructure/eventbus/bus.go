package eventbus

import "context"

type Handler func(context.Context, any) error

type Bus interface {
	Subscribe(string, Handler)
	Publish(context.Context, ...any) error
}
type inproc struct{ hs map[string][]Handler }

func NewInproc() Bus {
	return &inproc{hs: map[string][]Handler{}}
}

func (b *inproc) Subscribe(t string, h Handler) {
	b.hs[t] = append(b.hs[t], h)
}
func (b *inproc) Publish(ctx context.Context, evs ...any) error {
	for _, ev := range evs {
		et, ok := ev.(interface{ EventType() string })
		if !ok {
			continue
		}
		for _, h := range b.hs[et.EventType()] {
			if err := h(ctx, ev); err != nil {
				return err
			}
		}
	}
	return nil
}
