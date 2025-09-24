package exercise

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *exerciseServiceImpl) CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup, autoTranslate bool) error {
	err := s.muscleGroupRepo.Create(ctx, mg)
	if err != nil {
		return err
	}
	if autoTranslate {
		// TODO: Call translation service here...
	}
	return nil
}

func (s *exerciseServiceImpl) GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateMuscleGroup(ctx context.Context, id uint, updates map[string]any) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.UpdateReturning(ctx, id, updates)
}

func (s *exerciseServiceImpl) DeleteMuscleGroup(ctx context.Context, id uint) error {
	return s.muscleGroupRepo.Delete(ctx, id)
}
