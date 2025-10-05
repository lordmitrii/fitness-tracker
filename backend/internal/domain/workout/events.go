package workout

import "time"

type WorkoutCompleted struct {
	EventID   string
	WorkoutID uint
	UserID    uint
	At        time.Time
	First     bool 
}

func (e WorkoutCompleted) EventType() string { return "WorkoutCompleted" }
