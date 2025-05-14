package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type serviceImpl struct {
	repo workout.Repository
}

func NewService(repo workout.Repository) *serviceImpl {
	return &serviceImpl{repo}
}

func (s *serviceImpl) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.repo.CreateWorkout(ctx, w)
}

func (s *serviceImpl) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	return s.repo.GetWorkoutByID(ctx, id)
}

func (s *serviceImpl) ListWorkouts(ctx context.Context) ([]*workout.Workout, error) {
	return s.repo.ListWorkouts(ctx)
}

func (s *serviceImpl) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.repo.UpdateWorkout(ctx, w)
}

func (s *serviceImpl) DeleteWorkout(ctx context.Context, id uint) error {
	return s.repo.DeleteWorkout(ctx, id)
}
