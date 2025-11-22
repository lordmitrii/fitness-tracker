package http

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "github.com/lordmitrii/golang-web-gin/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/lordmitrii/golang-web-gin/internal/interface/http/handler"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

func NewServer(exerciseService usecase.ExerciseService, workoutService usecase.WorkoutService, userService usecase.UserService, aiService usecase.AIService, emailService usecase.EmailService, rateLimiter usecase.RateLimiter, adminService usecase.AdminService, rbacService usecase.RBACService, translationService usecase.TranslationService, versionsService usecase.VersionsService) *gin.Engine {
	if os.Getenv("DEVELOPMENT_MODE") == "true" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if os.Getenv("DEVELOPMENT_MODE") == "true" {
		corsConfig.AllowOriginFunc = func(origin string) bool { return true }
	} else if origins := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS")); origins != "" {
		splitOrigins := strings.Split(origins, ",")
		for i := range splitOrigins {
			splitOrigins[i] = strings.TrimSpace(splitOrigins[i])
		}
		corsConfig.AllowOrigins = splitOrigins
	} else {
		// Safe local defaults when no origins are provided in non-development
		corsConfig.AllowOrigins = []string{
			"http://localhost:8081",
			"http://127.0.0.1:8081",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		}
	}

	r.Use(cors.New(corsConfig))

	api := r.Group("/api")
	// api.Use(middleware.DebugHeaders())  // middleware to add debug headers to responses

	// Add handlers here
	handler.NewExerciseHandler(api, exerciseService, rbacService)
	handler.NewWorkoutHandler(api, workoutService)
	handler.NewUserHandler(api, userService)
	handler.NewAIHandler(api, aiService, rateLimiter, rbacService)
	handler.NewEmailHandler(api, emailService, rateLimiter, rbacService)
	handler.NewAdminHandler(api, adminService, rbacService)
	handler.NewTranslationHandler(api, translationService)
	handler.NewVersionsHandler(api, versionsService)

	// Swagger endpoint at /swagger/index.html
	if os.Getenv("SWAGGER_ENABLED") == "true" {
		user := os.Getenv("SWAGGER_USER")
		pass := os.Getenv("SWAGGER_PASS")
		if user != "" && pass != "" {
			r.GET("/swagger/*any", gin.BasicAuth(gin.Accounts{user: pass}), ginSwagger.WrapHandler(swaggerFiles.Handler))
		} else {
			r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		}
	}

	return r
}
