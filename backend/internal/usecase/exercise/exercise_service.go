package exercise

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *exerciseServiceImpl) CreateExercise(ctx context.Context, e *workout.Exercise, autoTranslate bool) error {
	err := s.exerciseRepo.Create(ctx, e)
	if err != nil {
		return err
	}
	if autoTranslate {
		// TODO: Call translation service here...
	}
	return nil
}

func (s *exerciseServiceImpl) GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetExercisesByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetByMuscleGroupID(ctx, muscleGroupID)
}

func (s *exerciseServiceImpl) GetAllExercises(ctx context.Context) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateExercise(ctx context.Context, id uint, updates map[string]any) (*workout.Exercise, error) {
	return s.exerciseRepo.UpdateReturning(ctx, id, updates)
}

func (s *exerciseServiceImpl) DeleteExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}