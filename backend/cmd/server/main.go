// @title        Fitness Tracker API
// @version      1.0
// @description  A workout logging API.
// @termsOfService https://example.com/terms/

// @contact.name   API Support
// @contact.url    https://example.com/support
// @contact.email  support@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api

package main

import (
	"os"

	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/email"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/ai"
	email_usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/email"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
	// "github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/inmemory"
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/postgres"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/job"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http"
	"time"
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

	emailTokenRepo := postgres.NewEmailTokenRepo(db)
	emailSender := email.NewGmailSender(
		os.Getenv("NOREPLY_EMAIL"),
		os.Getenv("NOREPLY_EMAIL_PASSWORD"),
	)

	var exerciseService usecase.ExerciseService = workout.NewExerciseService(exerciseRepo, muscleGroupRepo)
	var workoutService usecase.WorkoutService = workout.NewWorkoutService(workoutPlanRepo, workoutCycleRepo, workoutRepo, workoutExerciseRepo, workoutSetRepo, individualExerciseRepo, exerciseRepo)
	var userService usecase.UserService = user.NewUserService(userRepo, profileRepo, userConsentRepo)
	var aiService usecase.AIService = ai.NewAIService(workoutService, userService)
	var emailService usecase.EmailService = email_usecase.NewEmailService(userService, emailSender, emailTokenRepo)

	if os.Getenv("DEVELOPMENT_MODE") == "false" {
		cleanupJob := job.NewCleanupJob(db)
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		go cleanupJob.Run(ctx, 24*time.Hour)
	}

	server := http.NewServer(exerciseService, workoutService, userService, aiService, emailService)

	var port string
	if port = os.Getenv("PORT"); port == "" {
		port = "8080" // Default port if not set
	}
	server.Run(":" + port)
}
