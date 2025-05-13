package main

import (
	usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/inmemory"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http"

)

func main() {
	repo := inmemory.NewWorkoutRepo()
	service := usecase.NewService(repo)
	server := http.NewServer(service)
	server.Run(":8080")
}