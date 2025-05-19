package usecase

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type (
	WorkoutService interface {
		CreateWorkout(ctx context.Context, w *workout.Workout) error
		GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
		ListWorkouts(ctx context.Context) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, w *workout.Workout) error
		DeleteWorkout(ctx context.Context, id uint) error
	}
	UserService interface {
		Register(ctx context.Context, email, password string) error
		Authenticate(ctx context.Context, email, password string) (*user.User, error)
		CreateProfile(ctx context.Context, p *user.Profile) error
		GetProfile(ctx context.Context, userID uint) (*user.Profile, error)
		UpdateProfile(ctx context.Context, p *user.Profile) error
		DeleteProfile(ctx context.Context, id uint) error
	}
)
