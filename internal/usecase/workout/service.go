package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type Service struct {
	repo workout.Repository
}

func NewService(repo workout.Repository) *Service {
	return &Service{repo}
}

func (s *Service) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.repo.CreateWorkout(ctx, w)
}

func (s *Service) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	return s.repo.GetWorkoutByID(ctx, id)
}

func (s *Service) ListWorkouts(ctx context.Context) ([]workout.Workout, error) {
	return s.repo.ListWorkouts(ctx)
}

func (s *Service) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.repo.UpdateWorkout(ctx, w)
}

func (s *Service) DeleteWorkout(ctx context.Context, id uint) error {
	return s.repo.DeleteWorkout(ctx, id)
}
