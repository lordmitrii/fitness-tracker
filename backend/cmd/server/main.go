// @title           Fitness Tracker API
// @version         1.0
// @description     Public HTTP API for the Fitness Tracker app.
// @BasePath        /api
// @schemes         http https
//
// @contact.name    API Support
// @contact.url     https://example.com/support
// @contact.email   dev@example.com
//
// @securityDefinitions.apikey BearerAuth
// @in              header
// @name            Authorization
// @description     Format: Bearer <token>

package main

import (
	// "github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/events"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/ai"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/email"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/translations"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/admin"
	ai_usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/ai"
	email_usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/email"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/exercise"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/rbac"
	translations_usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/translations"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/versions"
	workout_usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
	"os"

	// "github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/inmemory"
	"context"
	"time"

	"log"

	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/postgres"
	myredis "github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/redis"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/job"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http"
)

func main() {
	// repo := inmemory.NewWorkoutRepo()
	var dsn string
	if dsn = os.Getenv("DATABASE_URL"); dsn == "" {
		dsn = "postgres://username:password@localhost:5432/fitness_tracker?sslmode=disable" // Default DSN if not set
	}

	db, err := postgres.NewPostgresDB(dsn)
	if err != nil {
		panic(err)
	}

	if err := postgres.AutoMigrate(db); err != nil {
		panic(err)
	}
	if err := postgres.AddUserIndexes(db, true); err != nil {
		panic(err)
	}
	if err := postgres.AddWorkoutIndex(db, true); err != nil {
		panic(err)
	}
	if err := postgres.SeedRBAC(db); err != nil {
		panic(err)
	}

	redisLimiter := myredis.NewRedisLimiter(os.Getenv("REDIS_ADDR"), os.Getenv("REDIS_PASSWORD"), 0)

	exerciseRepo := postgres.NewExerciseRepo(db)
	muscleGroupRepo := postgres.NewMuscleGroupRepo(db)

	workoutPlanRepo := postgres.NewWorkoutPlanRepo(db)
	workoutCycleRepo := postgres.NewWorkoutCycleRepo(db)
	workoutRepo := postgres.NewWorkoutRepo(db)
	workoutExerciseRepo := postgres.NewWorkoutExerciseRepo(db)
	individualExerciseRepo := postgres.NewIndividualExerciseRepo(db)
	workoutSetRepo := postgres.NewWorkoutSetRepo(db)

	userRepo := postgres.NewUserRepo(db)
	profileRepo := postgres.NewProfileRepo(db)
	userConsentRepo := postgres.NewUserConsentRepository(db)

	roleRepo := postgres.NewRoleRepo(db)
	permissionRepo := postgres.NewPermissionRepo(db)
	userSettingsRepo := postgres.NewUserSettingsRepo(db)

	emailTokenRepo := postgres.NewEmailTokenRepo(db)
	translationRepo := postgres.NewTranslationsRepo(db)
	missingTranslationRepo := postgres.NewMissingTranslationsRepo(db)

	versionRepo := postgres.NewVersionRepository(db)
	// emailSender := email.NewGmailSender(            //not working in digital ocean as port 587 is blocked
	// 	os.Getenv("NOREPLY_EMAIL"),
	// 	os.Getenv("NOREPLY_EMAIL_PASSWORD"),
	// )

	// emailSender := email.NewSESSender(              // not working cause we need to verify domain first - that means getting the paid email domain
	// 	os.Getenv("AWS_ACCESS_KEY_ID"),
	// 	os.Getenv("AWS_SECRET_ACCESS_KEY"),
	// 	os.Getenv("AWS_REGION"),
	// 	os.Getenv("AWS_FROM_EMAIL"),
	// )

	emailSender := email.NewSendGridSender(
		os.Getenv("SENDGRID_FROM_EMAIL"),
		os.Getenv("SENDGRID_API_KEY"),
	)

	if err := email.LoadTemplates("./"); err != nil {
		log.Printf("email templates not loaded, using inline fallback: %v", err)
	}

	translator := translations.NewDeepLTranslator(
		os.Getenv("DEEPL_AUTH_KEY"),
		os.Getenv("DEEPL_API_URL"),
	)

	openai := ai.NewOpenAI(
		os.Getenv("OPENAI_API_KEY"),
		1.0, // temperature
	)

	bus := eventbus.NewInproc()

	var exerciseService usecase.ExerciseService = exercise.NewExerciseService(exerciseRepo, muscleGroupRepo, translator, translationRepo, versionRepo)
	var workoutService usecase.WorkoutService = workout_usecase.NewWorkoutService(profileRepo, workoutPlanRepo, workoutCycleRepo, workoutRepo, workoutExerciseRepo, workoutSetRepo, individualExerciseRepo, exerciseRepo, db, bus)
	var userService usecase.UserService = user.NewUserService(userRepo, profileRepo, userConsentRepo, roleRepo, permissionRepo, userSettingsRepo)
	var aiService usecase.AIService = ai_usecase.NewAIService(workoutService, userService, openai)
	var emailService usecase.EmailService = email_usecase.NewEmailService(userRepo, roleRepo, emailSender, emailTokenRepo)
	var rbacService usecase.RBACService = rbac.NewRBACService(roleRepo, permissionRepo, userRepo)
	var adminService usecase.AdminService = admin.NewAdminService(userRepo, roleRepo, emailService)
	var translationService usecase.TranslationService = translations_usecase.NewTranslationService(translationRepo, missingTranslationRepo, versionRepo)
	var versionsService usecase.VersionsService = versions.NewVersionsService(versionRepo)

	events.RegisterAll(
		context.Background(),
		events.Deps{
			DB:             db,
			Bus:            bus,
			WorkoutService: workoutService,
			// AnalyticsSvc: analyticsSvc,
			// BadgeSvc:     badgeSvc,
		},
	)

	if os.Getenv("DEVELOPMENT_MODE") == "false" {
		cleanupJob := job.NewCleanupJob(db)
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		go cleanupJob.Run(ctx, 24*time.Hour)
	}

	server := http.NewServer(exerciseService, workoutService, userService, aiService, emailService, redisLimiter, adminService, rbacService, translationService, versionsService)

	var port string
	if port = os.Getenv("PORT"); port == "" {
		port = "8080" // Default port if not set
	}
	server.Run(":" + port)
}
