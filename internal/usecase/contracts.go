package usecase

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type Service interface {
	CreateWorkout(ctx context.Context, w *workout.Workout) error
	GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
	ListWorkouts(ctx context.Context) ([]*workout.Workout, error)
	UpdateWorkout(ctx context.Context, w *workout.Workout) error
	DeleteWorkout(ctx context.Context, id uint) error
}
