package workout

import (
	"context"
)

type WorkoutPlanRepository interface {
	Create(ctx context.Context, userId uint, wp *WorkoutPlan) error
	CreateReturning(ctx context.Context, userId uint, wp *WorkoutPlan) (*WorkoutPlan, error)
	GetByID(ctx context.Context, userId, id uint) (*WorkoutPlan, error)
	GetByUserID(ctx context.Context, userID uint) ([]*WorkoutPlan, error)
	Update(ctx context.Context, userId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, id uint, updates map[string]any) (*WorkoutPlan, error)
	Delete(ctx context.Context, userId, id uint) error
	DeactivateOthers(ctx context.Context, userID uint, exceptID uint) error
	GetByIDForUpdate(ctx context.Context, userId, id uint) (*WorkoutPlan, error)
	LockByIDForUpdate(ctx context.Context, userId, id uint) error
}

type WorkoutCycleRepository interface {
	Create(ctx context.Context, userId, planId uint, wc *WorkoutCycle) error
	GetByID(ctx context.Context, userId, planId, id uint) (*WorkoutCycle, error)
	GetByWorkoutPlanID(ctx context.Context, userId, planId uint) ([]*WorkoutCycle, error)
	GetByPlanIDAndWeek(ctx context.Context, userId, planID uint, week int) (*WorkoutCycle, error)
	GetMaxWeekNumberByPlanID(ctx context.Context, userId, planId uint) (int, error)
	Update(ctx context.Context, userId, planId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, planId, id uint, updates map[string]any) (*WorkoutCycle, error)
	Delete(ctx context.Context, userId, planId, id uint) error
	ClearData(ctx context.Context, userId, planId, id uint) error
	LockByIDForUpdate(ctx context.Context, userId, planId, id uint) error
	GetByIDForUpdate(ctx context.Context, userId, planId, id uint) (*WorkoutCycle, error)
}

type WorkoutRepository interface {
	GetOnlyByID(ctx context.Context, userId, id uint) (*Workout, error)
	UpdateOnlyById(ctx context.Context, userId, id uint, updates map[string]any) error
	Create(ctx context.Context, userId, planId, cycleId uint, w *Workout) error
	BulkCreate(ctx context.Context, userId, planId, cycleId uint, workouts []*Workout) error
	GetByID(ctx context.Context, userId, planId, cycleId, id uint) (*Workout, error)
	GetByWorkoutCycleID(ctx context.Context, userId, planId, cycleId uint) ([]*Workout, error)
	Update(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) (*Workout, error)
	Delete(ctx context.Context, userId, planId, cycleId, id uint) error
	GetIncompleteWorkoutsCount(ctx context.Context, userId, planId, cycleId uint) (int64, error)
	GetSkippedWorkoutsCount(ctx context.Context, userId, planId, cycleId uint) (int64, error)
	GetMaxWorkoutIndexByWorkoutCycleID(ctx context.Context, userId, planId, cycleId uint) (int, error)
	DecrementIndexesAfterWorkout(ctx context.Context, userId, planId, cycleId uint, deletedIndex int) error
	SwapWorkoutsByIndex(ctx context.Context, userId, planId, cycleId uint, index1, index2 int) error
	LockByIDForUpdate(ctx context.Context, userId, planId, cycleId uint, id uint) error
	GetByIDForUpdate(ctx context.Context, userId, planId, cycleId uint, id uint) (*Workout, error)
}

type WorkoutExerciseRepository interface {
	GetOnlyByID(ctx context.Context, userId, id uint) (*WorkoutExercise, error)
	Create(ctx context.Context, userId, planId, cycleId, workoutId uint, e *WorkoutExercise) error
	GetByID(ctx context.Context, userId, planId, cycleId, workoutId, id uint) (*WorkoutExercise, error)
	GetByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) ([]*WorkoutExercise, error)
	Update(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) (*WorkoutExercise, error)
	Delete(ctx context.Context, userId, planId, cycleId, workoutId, id uint) error
	GetPendingExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error)
	GetTotalExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error)
	GetSkippedExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error)
	GetLast5ByIndividualExerciseID(ctx context.Context, userId, individualExerciseIDs uint) ([]*WorkoutExercise, error)
	GetMaxIndexByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) (int, error)
	DecrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId uint, deletedIndex int) error
	IncrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId uint, index int) error
	SwapWorkoutExercisesByIndex(ctx context.Context, userId, planId, cycleId, workoutId uint, index1, index2 int) error
	LockByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId uint, id uint) error
	GetByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId uint, id uint) (*WorkoutExercise, error)
	MarkAllExercisesPending(ctx context.Context, userId, planId, cycleId, workoutId uint) error
	MarkAllPendingExercisesSkipped(ctx context.Context, userId, planId, cycleId, workoutId uint) error
	MarkAllExercisesCompleted(ctx context.Context, userId, planId, cycleId, workoutId uint) error
}

type WorkoutSetRepository interface {
	GetOnlyByWorkoutExerciseID(ctx context.Context, userId, workoutExerciseID uint) ([]*WorkoutSet, error)
	Create(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, ws *WorkoutSet) error
	GetByID(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) (*WorkoutSet, error)
	GetByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) ([]*WorkoutSet, error)
	Update(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) (*WorkoutSet, error)
	Delete(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) error
	GetPendingSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error)
	GetTotalSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error)
	GetSkippedSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error)
	GetMaxIndexByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int, error)
	DecrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, deletedIndex int) error
	IncrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, index int) error
	SwapWorkoutSetsByIndex(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, index1, index2 int) error
	GetByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, id uint) (*WorkoutSet, error)
	MarkAllSetsCompleted(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) error
	MarkAllPendingSetsSkipped(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) error
	MarkAllSetsPending(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) error
	MarkAllSetsPendingByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) error
	MarkAllSetsCompletedByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) error
	MarkAllPendingSetsSkippedByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) error
}

type ExerciseRepository interface {
	Create(ctx context.Context, e *Exercise) error
	GetByID(ctx context.Context, id uint) (*Exercise, error)
	GetByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*Exercise, error)
	GetAll(ctx context.Context) ([]*Exercise, error)
	Update(ctx context.Context, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*Exercise, error)
	Delete(ctx context.Context, id uint) error
}

type MuscleGroupRepository interface {
	Create(ctx context.Context, mg *MuscleGroup) error
	GetByID(ctx context.Context, id uint) (*MuscleGroup, error)
	GetByName(ctx context.Context, name string) (*MuscleGroup, error)
	GetAll(ctx context.Context) ([]*MuscleGroup, error)
	Update(ctx context.Context, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*MuscleGroup, error)
	Delete(ctx context.Context, id uint) error
}

type IndividualExerciseRepository interface {
	Create(ctx context.Context, userId uint, ie *IndividualExercise) error
	GetByID(ctx context.Context, userId, id uint) (*IndividualExercise, error)
	GetByIDForUpdate(ctx context.Context, userId, id uint) (*IndividualExercise, error)
	GetByUserID(ctx context.Context, userId uint) ([]*IndividualExercise, error)
	GetByUserAndExerciseID(ctx context.Context, userId, exerciseID uint) (*IndividualExercise, error)
	GetByNameMuscleGroupAndUser(ctx context.Context, userId uint, name string, muscleGroupID *uint) (*IndividualExercise, error)
	Update(ctx context.Context, userId, id uint, updates map[string]any) error
	UpdateReturning(ctx context.Context, userId, id uint, updates map[string]any) (*IndividualExercise, error)
	Delete(ctx context.Context, userId, id uint) error
	RewireLastCompletedWorkoutExercise(ctx context.Context, userId, id uint, newLastCompletedWorkoutExerciseID *uint) error
}
