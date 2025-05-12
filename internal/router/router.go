package router

import (
	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/handler"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/users", handler.GetUsers)
		api.POST("/users", handler.CreateUsers)
	}

	return r
}
