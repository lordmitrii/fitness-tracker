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
	repo := postgres.NewWorkoutRepo(db)

	var svc usecase.Service = workout.NewService(repo)

	service := workout.NewService(svc)
	server := http.NewServer(service)
	server.Run(":8080")
}