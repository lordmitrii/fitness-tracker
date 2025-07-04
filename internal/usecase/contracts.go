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

		CreateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error
		GetWorkoutCycleByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error)
		GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error)
		UpdateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error
		DeleteWorkoutCycle(ctx context.Context, id uint) error
		CompleteWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) (uint, error)

		CreateWorkout(ctx context.Context, w *workout.Workout) error
		GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
		GetWorkoutsByWorkoutCycleID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, w *workout.Workout) error
		DeleteWorkout(ctx context.Context, id uint) error

		CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error)
		GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error)
		UpdateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		CompleteWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		DeleteWorkoutExercise(ctx context.Context, id uint) error

		GetIndividualExercisesByUserID(ctx context.Context, workoutPlanID uint) ([]*workout.IndividualExercise, error)
		GetOrCreateIndividualExercise(ctx context.Context, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error)
	}

	ExerciseService interface {
		CreateExercise(ctx context.Context, e *workout.Exercise) error
		GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error)
		GetExercisesByMuscleGroup(ctx context.Context, muscleGroup string) ([]*workout.Exercise, error)
		GetAllExercises(ctx context.Context) ([]*workout.Exercise, error)
		UpdateExercise(ctx context.Context, e *workout.Exercise) error
		DeleteExercise(ctx context.Context, id uint) error
	}

	UserService interface {
		Register(ctx context.Context, email, password string) error
		Authenticate(ctx context.Context, email, password string) (*user.User, error)
		CreateProfile(ctx context.Context, p *user.Profile) error
		// DeleteUser(ctx context.Context, id uint) error
		GetProfile(ctx context.Context, userID uint) (*user.Profile, error)
		UpdateProfile(ctx context.Context, p *user.Profile) error
		DeleteProfile(ctx context.Context, id uint) error
	}
)
