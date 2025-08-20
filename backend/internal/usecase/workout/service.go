package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type workoutServiceImpl struct {
	workoutPlanRepo        workout.WorkoutPlanRepository
	workoutCycleRepo       workout.WorkoutCycleRepository
	workoutRepo            workout.WorkoutRepository
	workoutExerciseRepo    workout.WorkoutExerciseRepository
	workoutSetRepo         workout.WorkoutSetRepository
	individualExerciseRepo workout.IndividualExerciseRepository
	exerciseRepo           workout.ExerciseRepository
}

func NewWorkoutService(
	workoutPlanRepo workout.WorkoutPlanRepository,
	workoutCycleRepo workout.WorkoutCycleRepository,
	workoutRepo workout.WorkoutRepository,
	workoutExerciseRepo workout.WorkoutExerciseRepository,
	workoutSetRepo workout.WorkoutSetRepository,
	individualExerciseRepo workout.IndividualExerciseRepository,
	exerciseRepo workout.ExerciseRepository,
) *workoutServiceImpl {
	return &workoutServiceImpl{
		workoutPlanRepo:        workoutPlanRepo,
		workoutCycleRepo:       workoutCycleRepo,
		workoutRepo:            workoutRepo,
		workoutExerciseRepo:    workoutExerciseRepo,
		workoutSetRepo:         workoutSetRepo,
		individualExerciseRepo: individualExerciseRepo,
		exerciseRepo:           exerciseRepo,
	}
}
