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
		SetActiveWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error

		CreateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error
		GetWorkoutCycleByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error)
		GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error)
		UpdateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error
		DeleteWorkoutCycle(ctx context.Context, id uint) error
		CompleteWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) (uint, error)

		CreateWorkout(ctx context.Context, w *workout.Workout) error
		CreateMultipleWorkouts(ctx context.Context, cycleID uint, workouts []*workout.Workout) error
		GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
		GetWorkoutsByWorkoutCycleID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, w *workout.Workout) error
		DeleteWorkout(ctx context.Context, id uint) error

		CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise, qt int64) error
		GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error)
		GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error)
		UpdateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		CompleteWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		DeleteWorkoutExercise(ctx context.Context, id uint) error
		MoveWorkoutExercise(ctx context.Context, workoutID, exerciseID uint, direction string) error
		ReplaceWorkoutExercise(ctx context.Context, workoutID, exerciseID, individualExerciseID uint, sets int64) (*workout.WorkoutExercise, error)

		CreateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error
		GetWorkoutSetByID(ctx context.Context, id uint) (*workout.WorkoutSet, error)
		GetWorkoutSetsByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*workout.WorkoutSet, error)
		UpdateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error
		CompleteWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error
		DeleteWorkoutSet(ctx context.Context, id uint) error
		GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error)
		MoveWorkoutSet(ctx context.Context, exerciseID, setID uint, direction string) error

		GetIndividualExercisesByUserID(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error)
		GetOrCreateIndividualExercise(ctx context.Context, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error)
		GetIndividualExerciseStats(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error)

		GetPreviousSets(ctx context.Context, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error)
	}

	ExerciseService interface {
		CreateExercise(ctx context.Context, e *workout.Exercise) error
		GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error)
		GetExercisesByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error)
		GetAllExercises(ctx context.Context) ([]*workout.Exercise, error)
		UpdateExercise(ctx context.Context, e *workout.Exercise) error
		DeleteExercise(ctx context.Context, id uint) error

		CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error
		GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error)
		GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error)
		UpdateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error
		DeleteMuscleGroup(ctx context.Context, id uint) error
	}

	UserService interface {
		Register(ctx context.Context, email, password string, privacyConsent, healthDataConsent bool, privacyPolicyVersion, healthDataPolicyVersion string) error
		Authenticate(ctx context.Context, email, password string) (*user.User, error)
		CreateProfile(ctx context.Context, p *user.Profile) error
		// DeleteUser(ctx context.Context, id uint) error
		GetProfile(ctx context.Context, userID uint) (*user.Profile, error)
		UpdateProfile(ctx context.Context, p *user.Profile) error
		DeleteProfile(ctx context.Context, id uint) error

		GetConsents(ctx context.Context, userID uint) ([]*user.UserConsent, error)
		CreateConsent(ctx context.Context, consent *user.UserConsent) error
		UpdateConsent(ctx context.Context, consent *user.UserConsent) error
		DeleteConsent(ctx context.Context, userID uint, consentType, version string) error
	}

	AIService interface {
		AskStatsQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error)
	}
)
