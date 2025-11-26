package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"gorm.io/gorm"
)

type workoutServiceImpl struct {
	profileRepo            user.ProfileRepository
	workoutPlanRepo        workout.WorkoutPlanRepository
	workoutCycleRepo       workout.WorkoutCycleRepository
	workoutRepo            workout.WorkoutRepository
	workoutExerciseRepo    workout.WorkoutExerciseRepository
	workoutSetRepo         workout.WorkoutSetRepository
	individualExerciseRepo workout.IndividualExerciseRepository
	exerciseRepo           workout.ExerciseRepository

	db  *gorm.DB
	bus eventbus.Bus
	dispatcher *domainevt.Dispatcher
}

func NewWorkoutService(
	profileRepo user.ProfileRepository,
	workoutPlanRepo workout.WorkoutPlanRepository,
	workoutCycleRepo workout.WorkoutCycleRepository,
	workoutRepo workout.WorkoutRepository,
	workoutExerciseRepo workout.WorkoutExerciseRepository,
	workoutSetRepo workout.WorkoutSetRepository,
	individualExerciseRepo workout.IndividualExerciseRepository,
	exerciseRepo workout.ExerciseRepository,

	db *gorm.DB,
	bus eventbus.Bus,
	dispatcher *domainevt.Dispatcher,
) usecase.WorkoutService {
	return &workoutServiceImpl{
		profileRepo:            profileRepo,
		workoutPlanRepo:        workoutPlanRepo,
		workoutCycleRepo:       workoutCycleRepo,
		workoutRepo:            workoutRepo,
		workoutExerciseRepo:    workoutExerciseRepo,
		workoutSetRepo:         workoutSetRepo,
		individualExerciseRepo: individualExerciseRepo,
		exerciseRepo:           exerciseRepo,
		db:                     db,
		bus:                    bus,
		dispatcher:             dispatcher,
	}
}
