package events

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
	workoutevents "github.com/lordmitrii/golang-web-gin/internal/events/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type SyncDeps struct {
	Dispatcher     *domainevt.Dispatcher
	WorkoutService usecase.WorkoutService
}

func RegisterSyncAll(d SyncDeps) {
	workoutevents.RegisterSync(d.Dispatcher, workoutevents.SyncDeps{
		Workout: d.WorkoutService,
	})

	// user.RegisterSync(...)
	// rbac.RegisterSync(...)
	// etc as you add them
}
