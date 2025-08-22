package workout

import (
	"context"
)

type WorkoutPlanRepository interface {
	Create(ctx context.Context, wp *WorkoutPlan) error
	GetByID(ctx context.Context, id uint) (*WorkoutPlan, error)
	GetByUserID(ctx context.Context, userID uint) ([]*WorkoutPlan, error)
	Update(ctx context.Context, wp *WorkoutPlan) error
	Delete(ctx context.Context, id uint) error
	SetActive(ctx context.Context, wp *WorkoutPlan) (*WorkoutPlan, error)
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
	GetIncompleteWorkoutsCount(ctx context.Context, workoutCycleID uint) (int64, error)
	GetSkippedWorkoutsCount(ctx context.Context, workoutCycleID uint) (int64, error)
	GetMaxWorkoutIndexByWorkoutCycleID(ctx context.Context, workoutCycleID uint) (int, error)
	DecrementIndexesAfterWorkout(ctx context.Context, workoutCycleID uint, deletedIndex int) error
	SwapWorkoutsByIndex(ctx context.Context, workoutCycleID uint, index1, index2 int) error
}

type WorkoutExerciseRepository interface {
	Create(ctx context.Context, e *WorkoutExercise) error
	GetByID(ctx context.Context, id uint) (*WorkoutExercise, error)
	GetByWorkoutID(ctx context.Context, workoutID uint) ([]*WorkoutExercise, error)
	Update(ctx context.Context, e *WorkoutExercise) error
	Complete(ctx context.Context, e *WorkoutExercise) error
	Delete(ctx context.Context, id uint) error
	GetIncompleteExercisesCount(ctx context.Context, workoutId uint) (int64, error)
	GetSkippedExercisesCount(ctx context.Context, workoutId uint) (int64, error)
	GetLast5ByIndividualExerciseID(ctx context.Context, individualExerciseIDs uint) ([]*WorkoutExercise, error)
	GetMaxIndexByWorkoutID(ctx context.Context, workoutID uint) (int, error)
	DecrementIndexesAfter(ctx context.Context, workoutID uint, deletedIndex int) error
	IncrementIndexesAfter(ctx context.Context, workoutID uint, index int) error
	SwapWorkoutExercisesByIndex(ctx context.Context, workoutID uint, index1, index2 int) error
}

type WorkoutSetRepository interface {
	Create(ctx context.Context, ws *WorkoutSet) error
	GetByID(ctx context.Context, id uint) (*WorkoutSet, error)
	GetByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*WorkoutSet, error)
	Update(ctx context.Context, ws *WorkoutSet) error
	Complete(ctx context.Context, ws *WorkoutSet) error
	Delete(ctx context.Context, id uint) error
	GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error)
	GetSkippedSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error)
	GetMaxIndexByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) (int, error)
	DecrementIndexesAfter(ctx context.Context, workoutExerciseID uint, deletedIndex int) error
	IncrementIndexesAfter(ctx context.Context, workoutExerciseID uint, index int) error
	SwapWorkoutSetsByIndex(ctx context.Context, workoutExerciseID uint, index1, index2 int) error
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *Exercise) error
	GetByID(ctx context.Context, id uint) (*Exercise, error)
	GetByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*Exercise, error)
	GetAll(ctx context.Context) ([]*Exercise, error)
	Update(ctx context.Context, e *Exercise) error
	Delete(ctx context.Context, id uint) error
}

type IndividualExerciseRepository interface {
	Create(ctx context.Context, pe *IndividualExercise) error
	GetByID(ctx context.Context, id uint) (*IndividualExercise, error)
	GetByUserID(ctx context.Context, workoutPlanID uint) ([]*IndividualExercise, error)
	GetByUserAndExerciseID(ctx context.Context, planID, exerciseID uint) (*IndividualExercise, error)
	GetByNameMuscleGroupAndUser(ctx context.Context, name string, muscleGroupID *uint, userID uint) (*IndividualExercise, error)
	Update(ctx context.Context, pe *IndividualExercise) error
	Delete(ctx context.Context, id uint) error
}

type MuscleGroupRepository interface {
	Create(ctx context.Context, mg *MuscleGroup) error
	GetByID(ctx context.Context, id uint) (*MuscleGroup, error)
	GetByName(ctx context.Context, name string) (*MuscleGroup, error)
	GetAll(ctx context.Context) ([]*MuscleGroup, error)
	Update(ctx context.Context, mg *MuscleGroup) error
	Delete(ctx context.Context, id uint) error
}