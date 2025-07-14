package http

import (
	"os"

	"github.com/gin-gonic/gin"

	_ "github.com/lordmitrii/golang-web-gin/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/lordmitrii/golang-web-gin/internal/interface/http/handler"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

func NewServer(exerciseService usecase.ExerciseService, workoutService usecase.WorkoutService, userService usecase.UserService) *gin.Engine {
	if os.Getenv("DEVELOPMENT_MODE") == "true" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	api := r.Group("/api")

	// Add handlers here
	handler.NewExerciseHandler(api, exerciseService)
	handler.NewWorkoutHandler(api, workoutService)
	handler.NewUserHandler(api, userService)

	// Swagger endpoint at /swagger/index.html
	if os.Getenv("DEVELOPMENT_MODE") == "true" {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	return r
}
