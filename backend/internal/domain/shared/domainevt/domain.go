package domainevt

type Event interface {
	EventType() string
}

type EventsMixin struct {
	pending []Event
}

func (m *EventsMixin) PendingEvents() []Event {
	out := make([]Event, len(m.pending))
	copy(out, m.pending)
	return out
}
func (m *EventsMixin) ClearPendingEvents() { m.pending = nil }
func (m *EventsMixin) Raise(ev Event)      { m.pending = append(m.pending, ev) }

type EventSourced interface {
	PendingEvents() []Event
	ClearPendingEvents()
}
