package exercise

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *exerciseServiceImpl) CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error {
	return s.muscleGroupRepo.Create(ctx, mg)
}

func (s *exerciseServiceImpl) GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error {
	return s.muscleGroupRepo.Update(ctx, mg)
}

func (s *exerciseServiceImpl) DeleteMuscleGroup(ctx context.Context, id uint) error {
	return s.muscleGroupRepo.Delete(ctx, id)
}
