package usecase

import (
	"context"

	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type (
	WorkoutService interface {
		CreateWorkoutPlan(ctx context.Context, userId uint, wp *workout.WorkoutPlan) (*workout.WorkoutPlan, error)
		GetWorkoutPlanByID(ctx context.Context, userId, id uint) (*workout.WorkoutPlan, error)
		GetWorkoutPlansByUserID(ctx context.Context, userId uint) ([]*workout.WorkoutPlan, error)
		UpdateWorkoutPlan(ctx context.Context, userId, id uint, updates map[string]any) (*workout.WorkoutPlan, error)
		DeleteWorkoutPlan(ctx context.Context, userId, id uint) error
		SetActiveWorkoutPlan(ctx context.Context, userId, id uint, active bool) (*workout.WorkoutPlan, error)
		GetActivePlanByUserID(ctx context.Context, userId uint) (*workout.WorkoutPlan, error)

		CreateWorkoutCycle(ctx context.Context, userId, planId uint, wc *workout.WorkoutCycle) error
		GetWorkoutCycleByID(ctx context.Context, userId, planId, id uint) (*workout.WorkoutCycle, error)
		GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, userId, planId uint) ([]*workout.WorkoutCycle, error)
		UpdateWorkoutCycle(ctx context.Context, userId, planId, id uint, updates map[string]any) (*workout.WorkoutCycle, error)
		DeleteWorkoutCycle(ctx context.Context, userId, planId, id uint) error
		CompleteWorkoutCycle(ctx context.Context, userId, planId, id uint, completed, skipped bool) (*workout.WorkoutCycle, error)
		GetCurrentWorkoutCycle(ctx context.Context, userId uint) (*workout.WorkoutCycle, error)

		CreateWorkout(ctx context.Context, userId, planId, cycleId uint, w *workout.Workout) error
		CreateMultipleWorkouts(ctx context.Context, userId, planId, cycleId uint, workouts []*workout.Workout) error
		GetWorkoutByID(ctx context.Context, userId, planId, cycleId, id uint) (*workout.Workout, error)
		GetWorkoutsByWorkoutCycleID(ctx context.Context, userId, planId, cycleId uint) ([]*workout.Workout, error)
		UpdateWorkout(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) (*workout.Workout, error)
		DeleteWorkout(ctx context.Context, userId, planId, cycleId, id uint) error
		CompleteWorkout(ctx context.Context, userId, planId, cycleId, id uint, completed, skipped bool) (*workout.Workout, error)
		MoveWorkout(ctx context.Context, userId, planId, cycleId, id uint, direction string) error
		CalculateWorkoutSummary(ctx context.Context, userId, workoutID uint) error

		CreateWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId uint, e *workout.WorkoutExercise) error
		GetWorkoutExerciseByID(ctx context.Context, userId, planId, cycleId, workoutId, id uint) (*workout.WorkoutExercise, error)
		GetWorkoutExercisesByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutID uint) ([]*workout.WorkoutExercise, error)
		UpdateWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) (*workout.WorkoutExercise, error)
		CompleteWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId, id uint, completed, skipped bool) (*workout.WorkoutExercise, error)
		DeleteWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, id uint) error
		MoveWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, id uint, direction string) error
		ReplaceWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, exerciseID, individualExerciseID uint, setsQt int64) (*workout.WorkoutExercise, error)

		CreateWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, ws *workout.WorkoutSet) error
		GetWorkoutSetByID(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) (*workout.WorkoutSet, error)
		GetWorkoutSetsByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) ([]*workout.WorkoutSet, error)
		UpdateWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) (*workout.WorkoutSet, error)
		CompleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, completed, skipped bool) (*workout.WorkoutSet, error)
		DeleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) error
		GetIncompleteSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error)
		MoveWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, direction string) error
		GetPreviousSets(ctx context.Context, userId, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error)

		GetIndividualExercisesByUserID(ctx context.Context, userId uint) ([]*workout.IndividualExercise, error)
		GetOrCreateIndividualExercise(ctx context.Context, userId uint, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error)
		GetIndividualExerciseStats(ctx context.Context, userId uint) ([]*workout.IndividualExercise, error)
	}

	ExerciseService interface {
		CreateExercise(ctx context.Context, e *workout.Exercise, autoTranslate bool) error
		GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error)
		GetExercisesByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error)
		GetAllExercises(ctx context.Context) ([]*workout.Exercise, error)
		UpdateExercise(ctx context.Context, id uint, updates map[string]any) (*workout.Exercise, error)
		DeleteExercise(ctx context.Context, id uint) error

		CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup, autoTranslate bool) error
		GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error)
		GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error)
		UpdateMuscleGroup(ctx context.Context, id uint, updates map[string]any) (*workout.MuscleGroup, error)
		DeleteMuscleGroup(ctx context.Context, id uint) error
	}

	UserService interface {
		Register(ctx context.Context, username, email, password string, privacyConsent, healthDataConsent bool, privacyPolicyVersion, healthDataPolicyVersion string) error
		Authenticate(ctx context.Context, username, password string) (*user.User, error)

		Me(ctx context.Context, userID uint) (*user.User, error)
		UpdateAccount(ctx context.Context, userID uint, updates map[string]any) (*user.User, error)

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
	SendVerificationEmail(ctx context.Context, to, lang string) error
	SendResetPasswordEmail(ctx context.Context, to, lang string) error
	ValidateToken(ctx context.Context, token, tokenType string) (bool, error)
	ResetPassword(ctx context.Context, token, newPassword string) error
	VerifyAccount(ctx context.Context, token string) error
}
type TranslationService interface {
	GetTranslations(ctx context.Context, namespace, locale string) ([]*translations.Translation, error)
	UpdateTranslation(ctx context.Context, id uint, updates map[string]any) error
	CreateTranslation(ctx context.Context, translation *translations.Translation) error
	DeleteTranslation(ctx context.Context, id uint) error
	ReportMissingTranslations(ctx context.Context, translations []*translations.MissingTranslation) error
	GetI18nMeta(ctx context.Context, locales, namespaces string) (map[string]map[string]string, error)
}
type VersionsService interface {
	GetCurrentVersion(ctx context.Context, key string) (*versions.Version, error)
	GetAllVersions(ctx context.Context) ([]*versions.Version, error)
}
type RateLimiter interface {
	Allow(ctx context.Context, key string, limit int, per time.Duration) (bool, time.Duration, error)
}
