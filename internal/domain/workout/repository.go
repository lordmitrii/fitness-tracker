package workout

import "context"

type WorkoutPlanRepository interface {
	Create(ctx context.Context, wp *WorkoutPlan) error
	GetByID(ctx context.Context, id uint) (*WorkoutPlan, error)
	GetByUserID(ctx context.Context, userID uint) ([]*WorkoutPlan, error)
	Update(ctx context.Context, wp *WorkoutPlan) error
	Delete(ctx context.Context, id uint) error
}

type WorkoutRepository interface {
	Create(ctx context.Context, w *Workout) error
	GetByID(ctx context.Context, id uint) (*Workout, error)
	GetByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*Workout, error)
	Update(ctx context.Context, w *Workout) error
	Delete(ctx context.Context, id uint) error
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *Exercise) error
	GetByID(ctx context.Context, id uint) (*Exercise, error)
	GetByWorkoutID(ctx context.Context, workoutID uint) ([]*Exercise, error)
	Update(ctx context.Context, e *Exercise) error
	Delete(ctx context.Context, id uint) error
}
