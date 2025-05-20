package workout

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type serviceImpl struct {
	workoutPlanRepo workout.WorkoutPlanRepository
	workoutRepo     workout.WorkoutRepository
	exerciseRepo    workout.ExerciseRepository
}

func NewService(workoutPlanRepo workout.WorkoutPlanRepository, workoutRepo workout.WorkoutRepository, exerciseRepo workout.ExerciseRepository) *serviceImpl {
	return &serviceImpl{
		workoutPlanRepo: workoutPlanRepo,
		workoutRepo:     workoutRepo,
		exerciseRepo:    exerciseRepo,
	}
}

func (s *serviceImpl) CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	return s.workoutPlanRepo.Create(ctx, wp)
}

func (s *serviceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, id)
}

func (s *serviceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

func (s *serviceImpl) UpdateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	return s.workoutPlanRepo.Update(ctx, wp)
}

func (s *serviceImpl) DeleteWorkoutPlan(ctx context.Context, id uint) error {
	return s.workoutPlanRepo.Delete(ctx, id)
}

func (s *serviceImpl) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.workoutRepo.Create(ctx, w)
}

func (s *serviceImpl) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	return s.workoutRepo.GetByID(ctx, id)
}
func (s *serviceImpl) GetWorkoutsByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error) {
	return s.workoutRepo.GetByWorkoutPlanID(ctx, workoutPlanID)
}
func (s *serviceImpl) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.workoutRepo.Update(ctx, w)
}
func (s *serviceImpl) DeleteWorkout(ctx context.Context, id uint) error {
	return s.workoutRepo.Delete(ctx, id)
}
func (s *serviceImpl) CreateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Create(ctx, e)
}
func (s *serviceImpl) GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}
func (s *serviceImpl) GetExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetByWorkoutID(ctx, workoutID)
}

func (s *serviceImpl) UpdateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Update(ctx, e)
}

func (s *serviceImpl) DeleteExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}
