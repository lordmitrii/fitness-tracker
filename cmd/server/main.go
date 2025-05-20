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
	
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/user"
	// "github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/inmemory"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/postgres"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http"

)

func main() {
	// repo := inmemory.NewWorkoutRepo()
	db, err := postgres.NewPostgresDB("postgres://username:password@localhost:5432/fitness_tracker?sslmode=disable")
	if err != nil {
		panic(err)
	}

	if err := postgres.AutoMigrate(db); err != nil {
		panic(err)
	}

	workoutPlanRepo := postgres.NewWorkoutPlanRepo(db)
	workoutRepo := postgres.NewWorkoutRepo(db)
	exerciseRepo := postgres.NewExerciseRepo(db)

	userRepo := postgres.NewUserRepo(db)
	profileRepo := postgres.NewProfileRepo(db)

	var workoutService usecase.WorkoutService = workout.NewService(workoutPlanRepo, workoutRepo, exerciseRepo)
	var userService usecase.UserService = user.NewService(userRepo, profileRepo)

	server := http.NewServer(workoutService, userService)
	server.Run(":8080")
}