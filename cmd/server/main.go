package main

import (
	"log"

    "github.com/lordmitrii/golang-web-gin/internal/router"
    "github.com/lordmitrii/golang-web-gin/internal/config"
    "github.com/lordmitrii/golang-web-gin/internal/model"
)

func main() {
    config.InitDB()

    // Migrations
    if err := config.DB.AutoMigrate(&model.User{}); err != nil {
		log.Fatal("migration failed: ", err)
	}

    // Start server
	r := router.SetupRouter()
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
