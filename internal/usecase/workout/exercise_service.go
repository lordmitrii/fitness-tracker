package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type exerciseServiceImpl struct {
	exerciseRepo workout.ExerciseRepository
}

func NewExerciseService(exerciseRepo workout.ExerciseRepository) *exerciseServiceImpl {
	return &exerciseServiceImpl{exerciseRepo: exerciseRepo}
}

func (s *exerciseServiceImpl) CreateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Create(ctx, e)
}

func (s *exerciseServiceImpl) GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetExercisesByMuscleGroup(ctx context.Context, muscleGroup string) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetByMuscleGroup(ctx, muscleGroup)
}

func (s *exerciseServiceImpl) GetAllExercises(ctx context.Context) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Update(ctx, e)
}

func (s *exerciseServiceImpl) DeleteExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}

