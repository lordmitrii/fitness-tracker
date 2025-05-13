package http

import (
	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/handler"
)

func NewServer(workoutService *workout.Service) *gin.Engine {
	r := gin.Default()
	api := r.Group("/api")
	handler.NewWorkoutHandler(api, workoutService)
	return r
}
