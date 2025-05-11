package main

import (
	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/books/handler"
)

func main() {
	r := gin.Default()

	handler.RegisterRoutes(r)

	r.Run(":8080")
}
