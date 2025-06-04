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

	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/workout"

	// "github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/inmemory"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/postgres"
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

	exerciseRepo := postgres.NewExerciseRepo(db)

	workoutPlanRepo := postgres.NewWorkoutPlanRepo(db)
	workoutCycleRepo := postgres.NewWorkoutCycleRepo(db)
	workoutRepo := postgres.NewWorkoutRepo(db)
	workoutExerciseRepo := postgres.NewWorkoutExerciseRepo(db)

	userRepo := postgres.NewUserRepo(db)
	profileRepo := postgres.NewProfileRepo(db)

	var exerciseService usecase.ExerciseService = workout.NewExerciseService(exerciseRepo)
	var workoutService usecase.WorkoutService = workout.NewWorkoutService(workoutPlanRepo, workoutCycleRepo, workoutRepo, workoutExerciseRepo)
	var userService usecase.UserService = user.NewUserService(userRepo, profileRepo)

	server := http.NewServer(exerciseService, workoutService, userService)

	var port string
	if port = os.Getenv("PORT"); port == "" {
		port = "8080" // Default port if not set
	}	
	server.Run(":" + port) 
}
