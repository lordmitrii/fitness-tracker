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
	GetByPlanIDAndWeek(ctx context.Context, planID uint, week int) (*WorkoutCycle, error)
	GetMaxWeekNumberByPlanID(ctx context.Context, workoutPlanID uint) (int, error)
	Update(ctx context.Context, wc *WorkoutCycle) error
	UpdateNextCycleID(ctx context.Context, id, nextID uint) error
	UpdatePrevCycleID(ctx context.Context, id, previousID uint) error
	Complete(ctx context.Context, wc *WorkoutCycle) error
	Delete(ctx context.Context, id uint) error
	ClearData(ctx context.Context, id uint) error
}


type WorkoutRepository interface {
	Create(ctx context.Context, w *Workout) error
	BulkCreate(ctx context.Context, workouts []*Workout) error
	GetByID(ctx context.Context, id uint) (*Workout, error)
	GetByWorkoutCycleID(ctx context.Context, workoutCycleID uint) ([]*Workout, error)
	Update(ctx context.Context, w *Workout) error
	Delete(ctx context.Context, id uint) error
	Complete(ctx context.Context, w *Workout) error
	GetIncompleteExercisesCount(ctx context.Context, id uint) (int64, error)
}

type WorkoutExerciseRepository interface {
	Create(ctx context.Context, e *WorkoutExercise) error
	GetByID(ctx context.Context, id uint) (*WorkoutExercise, error)
	GetByWorkoutID(ctx context.Context, workoutID uint) ([]*WorkoutExercise, error)
	Update(ctx context.Context, e *WorkoutExercise) error
	Complete(ctx context.Context, e *WorkoutExercise) error
	Delete(ctx context.Context, id uint) error
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *Exercise) error
	GetByID(ctx context.Context, id uint) (*Exercise, error)
	GetByMuscleGroup(ctx context.Context, muscleGroup string) ([]*Exercise, error)
	GetAll(ctx context.Context) ([]*Exercise, error)
	Update(ctx context.Context, e *Exercise) error
	Delete(ctx context.Context, id uint) error
}