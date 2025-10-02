package workout

import (
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
)

type WorkoutCompleted struct {
	WorkoutID uint
	At        time.Time
}

func (e WorkoutCompleted) EventType() string { return "WorkoutCompleted" }

type Workout struct {
	ID             uint       `gorm:"primaryKey"`
	Name           string     `gorm:"not null"`
	WorkoutCycleID uint       `gorm:"not null;index:idx_workout_cycle__index,priority:1;index"`
	Date           *time.Time // `gorm:"index"` // optional if sort/filter by date in the future
	Index          int        `gorm:"index:idx_workout_cycle__index,priority:2"`

	WorkoutExercises  []*WorkoutExercise `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Completed         bool               `gorm:"default:false"`
	Skipped           bool               `gorm:"default:false"`
	PreviousWorkoutID *uint              `gorm:"index"`

	CreatedAt *time.Time
	UpdatedAt *time.Time

	domainevt.EventsMixin `gorm:"-"`
}

func (w *Workout) MarkCompletedDirect(now time.Time) {
	if w.Completed {
		return
	}
	w.Completed = true
	w.Skipped = false
	w.Raise(WorkoutCompleted{WorkoutID: w.ID, At: now})
}

func (w *Workout) MarkSkipped() {
	if w.Completed {
		return
	}
	w.Skipped = true
}

func (w *Workout) OnSetCompleted(total, done int, now time.Time) {
	if w.Completed {
		return
	}
	if total > 0 && done >= total {
		w.Completed = true
		w.Skipped = false
		w.Raise(WorkoutCompleted{WorkoutID: w.ID, At: now})
	}
}
