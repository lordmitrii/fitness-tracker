package workout

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
	domain "github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type SyncDeps struct {
	Workout usecase.WorkoutService
}

func RegisterSync(dispatcher *domainevt.Dispatcher, deps SyncDeps) {
	dispatcher.Register("WorkoutCompleted", func(ctx context.Context, e domainevt.Event) error {
		ev := e.(domain.WorkoutCompleted)

		// if !ev.First {
		// 	return nil
		// }

		// if deps.Workout == nil {
		// 	return nil
		// }

		_, _, _, err := deps.Workout.CalculateWorkoutSummary(ctx, ev.UserID, ev.WorkoutID)
		return err
	})
}
