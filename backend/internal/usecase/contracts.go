package usecase

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"time"
)

type (
	WorkoutService interface {
		CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) (*workout.WorkoutPlan, error)
		GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error)
		GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error)
		UpdateWorkoutPlan(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutPlan, error)
		DeleteWorkoutPlan(ctx context.Context, id uint) error
		SetActiveWorkoutPlan(ctx context.Context, id uint, active bool) (*workout.WorkoutPlan, error)
		GetActivePlanByUserID(ctx context.Context, userID uint) (*workout.WorkoutPlan, error)

		CreateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error
		GetWorkoutCycleByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error)
		GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error)
		UpdateWorkoutCycle(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutCycle, error)
		DeleteWorkoutCycle(ctx context.Context, id uint) error
		CompleteWorkoutCycle(ctx context.Context, id uint, completed, skipped bool) (*workout.WorkoutCycle, error)
		GetCurrentWorkoutCycle(ctx context.Context, userID uint) (*workout.WorkoutCycle, error)

		CreateWorkout(ctx context.Context, w *workout.Workout) error
		CreateMultipleWorkouts(ctx context.Context, cycleID uint, workouts []*workout.Workout) error
		GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error)
		GetWorkoutsByWorkoutCycleID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, id uint, updates map[string]any) (*workout.Workout, error)
		DeleteWorkout(ctx context.Context, id uint) error
		CompleteWorkout(ctx context.Context, id uint, completed, skipped bool) (*workout.Workout, error)
		MoveWorkout(ctx context.Context, workoutID, cycleID uint, direction string) error

		CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error
		GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error)
		GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error)
		UpdateWorkoutExercise(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutExercise, error)
		CompleteWorkoutExercise(ctx context.Context, id uint, completed, skipped bool) (*workout.WorkoutExercise, error)
		DeleteWorkoutExercise(ctx context.Context, id uint) error
		MoveWorkoutExercise(ctx context.Context, workoutID, exerciseID uint, direction string) error
		ReplaceWorkoutExercise(ctx context.Context, workoutID, exerciseID, individualExerciseID uint, sets int64) (*workout.WorkoutExercise, error)

		CreateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error
		GetWorkoutSetByID(ctx context.Context, id uint) (*workout.WorkoutSet, error)
		GetWorkoutSetsByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*workout.WorkoutSet, error)
		UpdateWorkoutSet(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutSet, error)
		CompleteWorkoutSet(ctx context.Context, id uint, completed, skipped bool) (*workout.WorkoutSet, error)
		DeleteWorkoutSet(ctx context.Context, id uint) error
		GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error)
		MoveWorkoutSet(ctx context.Context, exerciseID, setID uint, direction string) error
		GetPreviousSets(ctx context.Context, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error)

		GetIndividualExercisesByUserID(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error)
		GetOrCreateIndividualExercise(ctx context.Context, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error)
		GetIndividualExerciseStats(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error)
	}

	ExerciseService interface {
		CreateExercise(ctx context.Context, e *workout.Exercise) error
		GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error)
		GetExercisesByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error)
		GetAllExercises(ctx context.Context) ([]*workout.Exercise, error)
		UpdateExercise(ctx context.Context, id uint, updates map[string]any) (*workout.Exercise, error)
		DeleteExercise(ctx context.Context, id uint) error

		CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error
		GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error)
		GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error)
		UpdateMuscleGroup(ctx context.Context, id uint, updates map[string]any) (*workout.MuscleGroup, error)
		DeleteMuscleGroup(ctx context.Context, id uint) error
	}

	UserService interface {
		Register(ctx context.Context, email, password string, privacyConsent, healthDataConsent bool, privacyPolicyVersion, healthDataPolicyVersion string) error
		Authenticate(ctx context.Context, email, password string) (*user.User, error)
		Me(ctx context.Context, userID uint) (*user.User, error)

		CreateProfile(ctx context.Context, p *user.Profile) error
		// DeleteUser(ctx context.Context, id uint) error
		GetProfile(ctx context.Context, userID uint) (*user.Profile, error)
		TouchLastSeen(ctx context.Context, userID uint) error
		UpdateProfile(ctx context.Context, id uint, updates map[string]any) (*user.Profile, error)
		DeleteProfile(ctx context.Context, id uint) error

		GetConsents(ctx context.Context, userID uint) ([]*user.UserConsent, error)
		CreateConsent(ctx context.Context, consent *user.UserConsent) error
		UpdateConsent(ctx context.Context, id uint, updates map[string]any) (*user.UserConsent, error)
		DeleteConsent(ctx context.Context, userID uint, consentType, version string) error

		SetVerified(ctx context.Context, email string) error
		CheckEmail(ctx context.Context, email string) (bool, error)
		ResetPassword(ctx context.Context, email, newPassword string) error

		GetUserSettings(ctx context.Context, userID uint) (*user.UserSettings, error)
		UpdateUserSettings(ctx context.Context, userID uint, updates map[string]any) (*user.UserSettings, error)
		CreateUserSettings(ctx context.Context, settings *user.UserSettings) error
		DeleteUserSettings(ctx context.Context, userID uint) error
	}

	AdminService interface {
		ListUsers(ctx context.Context, q string, page, pageSize int64, sortBy, sortDir string) ([]*user.User, int64, error)
		ListRoles(ctx context.Context) ([]*rbac.Role, error)
		SetUserRoles(ctx context.Context, userID uint, roleNames []string) error
		TriggerResetUserPassword(ctx context.Context, userID uint) error
		DeleteUser(ctx context.Context, userID uint) error
	}

	RBACService interface {
		HasRole(ctx context.Context, userID uint, roleName string) (bool, error)
		HasPermission(ctx context.Context, userID uint, permKey string) (bool, error)
		GetUserRoles(ctx context.Context, userID uint) ([]*rbac.Role, error)
		GetUserPermissions(ctx context.Context, userID uint) ([]*rbac.Permission, error)
	}
)

type AIService interface {
	AskStatsQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error)
	AskWorkoutsQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error)
	AskGeneralQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error)
}

type EmailService interface {
	SendNotificationEmail(ctx context.Context, to, subject, body string) error
	SendVerificationEmail(ctx context.Context, to string) error
	SendResetPasswordEmail(ctx context.Context, to string) error
	ValidateToken(ctx context.Context, token, tokenType string) (bool, error)
	ResetPassword(ctx context.Context, token, newPassword string) error
	VerifyAccount(ctx context.Context, token string) error
}
type RateLimiter interface {
	Allow(ctx context.Context, key string, limit int, per time.Duration) (bool, time.Duration, error)
}
