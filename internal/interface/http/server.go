package http

import (
	"github.com/gin-gonic/gin"
	
	swaggerFiles "github.com/swaggo/files"
    ginSwagger   "github.com/swaggo/gin-swagger"
	_ "github.com/lordmitrii/golang-web-gin/docs" 

	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/handler"
)

func NewServer(workoutService usecase.Service) *gin.Engine {
	r := gin.Default()
	api := r.Group("/api")

	// Add handlers here
	handler.NewWorkoutHandler(api, workoutService)

	// Swagger endpoint at /swagger/index.html
    r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return r
}
