package usecase

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type (
	WorkoutService interface {
		CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error
		GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error)
		GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error)
		UpdateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error
		DeleteWorkoutPlan(ctx context.Context, id uint) error

		CreateWorkout(ctx context.Context, w *workout.Workout) error
		GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
		GetWorkoutsByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, w *workout.Workout) error
		DeleteWorkout(ctx context.Context, id uint) error

		CreateExercise(ctx context.Context, e *workout.Exercise) error
		GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error)
		GetExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.Exercise, error)
		UpdateExercise(ctx context.Context, e *workout.Exercise) error
		DeleteExercise(ctx context.Context, id uint) error
	};
	
	UserService interface {
		Register(ctx context.Context, email, password string) error
		Authenticate(ctx context.Context, email, password string) (*user.User, error)
		CreateProfile(ctx context.Context, p *user.Profile) error
		GetProfile(ctx context.Context, userID uint) (*user.Profile, error)
		UpdateProfile(ctx context.Context, p *user.Profile) error
		DeleteProfile(ctx context.Context, id uint) error
	}
)
