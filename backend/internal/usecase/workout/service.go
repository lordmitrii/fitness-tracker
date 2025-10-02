package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"gorm.io/gorm"
)

type workoutServiceImpl struct {
	workoutPlanRepo        workout.WorkoutPlanRepository
	workoutCycleRepo       workout.WorkoutCycleRepository
	workoutRepo            workout.WorkoutRepository
	workoutExerciseRepo    workout.WorkoutExerciseRepository
	workoutSetRepo         workout.WorkoutSetRepository
	individualExerciseRepo workout.IndividualExerciseRepository
	exerciseRepo           workout.ExerciseRepository

	db  *gorm.DB
	bus eventbus.Bus
}

func NewWorkoutService(
	workoutPlanRepo workout.WorkoutPlanRepository,
	workoutCycleRepo workout.WorkoutCycleRepository,
	workoutRepo workout.WorkoutRepository,
	workoutExerciseRepo workout.WorkoutExerciseRepository,
	workoutSetRepo workout.WorkoutSetRepository,
	individualExerciseRepo workout.IndividualExerciseRepository,
	exerciseRepo workout.ExerciseRepository,

	db *gorm.DB,
	bus eventbus.Bus,
) usecase.WorkoutService {
	return &workoutServiceImpl{
		workoutPlanRepo:        workoutPlanRepo,
		workoutCycleRepo:       workoutCycleRepo,
		workoutRepo:            workoutRepo,
		workoutExerciseRepo:    workoutExerciseRepo,
		workoutSetRepo:         workoutSetRepo,
		individualExerciseRepo: individualExerciseRepo,
		exerciseRepo:           exerciseRepo,
		db:                     db,
		bus:                    bus,
	}
}
