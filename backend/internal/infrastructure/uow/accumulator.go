package uow

type EventAccumulator struct{ Evs []any }

func (a *EventAccumulator) Add(evs ...any) {
	a.Evs = append(a.Evs, evs...)
}
func (a *EventAccumulator) Drain() []any {
	out := a.Evs
	a.Evs = nil
	return out
}
