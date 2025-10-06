package domainevt

type Event interface{ EventType() string }

type EventsMixin struct{ pending []Event }

func (m *EventsMixin) Raise(e Event) { m.pending = append(m.pending, e) }
func (m *EventsMixin) PendingEvents() []Event {
	out := make([]Event, len(m.pending))
	copy(out, m.pending)
	return out
}
func (m *EventsMixin) ClearPendingEvents() { m.pending = nil }
