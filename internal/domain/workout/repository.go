package workout

import "context"

type WorkoutPlanRepository interface {
	Create(ctx context.Context, wp *WorkoutPlan) error
	GetByID(ctx context.Context, id uint) (*WorkoutPlan, error)
	GetByUserID(ctx context.Context, userID uint) ([]*WorkoutPlan, error)
	Update(ctx context.Context, wp *WorkoutPlan) error
	Delete(ctx context.Context, id uint) error
}

type WorkoutCycleRepository interface {
	Create(ctx context.Context, wc *WorkoutCycle) error
	GetByID(ctx context.Context, id uint) (*WorkoutCycle, error)
	GetByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*WorkoutCycle, error)
	Update(ctx context.Context, wc *WorkoutCycle) error
	Delete(ctx context.Context, id uint) error
}


type WorkoutRepository interface {
	Create(ctx context.Context, w *Workout) error
	GetByID(ctx context.Context, id uint) (*Workout, error)
	GetByWorkoutCycleID(ctx context.Context, workoutCycleID uint) ([]*Workout, error)
	Update(ctx context.Context, w *Workout) error
	Delete(ctx context.Context, id uint) error
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *WorkoutExercise) error
	GetByID(ctx context.Context, id uint) (*WorkoutExercise, error)
	GetByWorkoutID(ctx context.Context, workoutID uint) ([]*WorkoutExercise, error)
	Update(ctx context.Context, e *WorkoutExercise) error
	Delete(ctx context.Context, id uint) error
}
