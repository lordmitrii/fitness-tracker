package workout

import (
	"context"
	// "strconv"

	"gorm.io/gorm"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/events/idem"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type Handlers struct {
	db      *gorm.DB
	workout usecase.WorkoutService
}

func New(db *gorm.DB, workout usecase.WorkoutService) *Handlers {
	return &Handlers{db: db, workout: workout}
}

func (h *Handlers) Register(bus eventbus.Bus) {
	bus.Subscribe("WorkoutCompleted", h.onWorkoutCompleted)
}

func (h *Handlers) onWorkoutCompleted(ctx context.Context, e any) error {
	ev := e.(workout.WorkoutCompleted)
	// key := strconv.FormatUint(uint64(ev.WorkoutID), 10)

	key := ev.EventID

	return idem.TryProcess(ctx, h.db, "workout.summary", "WorkoutCompleted", key,
		func(ctx context.Context) error {
			if h.workout == nil {
				return nil
			}
			h.workout.CalculateWorkoutSummary(ctx, ev.UserID, ev.WorkoutID) // suppress error
			return nil
		})
}
