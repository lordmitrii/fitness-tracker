package workout

import "context"

type Repository interface {
	CreateWorkout(ctx context.Context, w *Workout) error
	GetWorkoutByID(ctx context.Context, id uint) (*Workout, error)
	ListWorkouts(ctx context.Context) ([]Workout, error)
	UpdateWorkout(ctx context.Context, w *Workout) error
	DeleteWorkout(ctx context.Context, id uint) error
}
