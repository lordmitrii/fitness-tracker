package app

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "github.com/lordmitrii/golang-web-gin/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/99designs/gqlgen/graphql/playground"
	graphqlapi "github.com/lordmitrii/golang-web-gin/internal/interface/graphql"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/handler"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

// NewServer wires the HTTP and GraphQL transports into a single Gin engine.
func NewServer(
	cfg Config,
	exerciseService usecase.ExerciseService,
	workoutService usecase.WorkoutService,
	userService usecase.UserService,
	aiService usecase.AIService,
	emailService usecase.EmailService,
	rateLimiter usecase.RateLimiter,
	adminService usecase.AdminService,
	rbacService usecase.RBACService,
	translationService usecase.TranslationService,
	versionsService usecase.VersionsService,
) *gin.Engine {
	if cfg.DevelopmentMode {
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

	if cfg.DevelopmentMode {
		corsConfig.AllowOriginFunc = func(origin string) bool { return true }
	} else {
		corsConfig.AllowOrigins = cfg.CorsAllowed
	}

	r.Use(cors.New(corsConfig))

	api := r.Group("/api")
	// api.Use(middleware.DebugHeaders())  // middleware to add debug headers to responses

	// HTTP handlers
	handler.NewExerciseHandler(api, exerciseService, rbacService)
	handler.NewWorkoutHandler(api, workoutService)
	handler.NewUserHandler(api, userService)
	handler.NewAIHandler(api, aiService, rateLimiter, rbacService)
	handler.NewEmailHandler(api, emailService, rateLimiter, rbacService)
	handler.NewAdminHandler(api, adminService, rbacService)
	handler.NewTranslationHandler(api, translationService)
	handler.NewVersionsHandler(api, versionsService)

	// Swagger endpoint at /swagger/index.html
	if cfg.SwaggerEnabled {
		if cfg.SwaggerUser != "" && cfg.SwaggerPass != "" {
			r.GET("/swagger/*any", gin.BasicAuth(gin.Accounts{cfg.SwaggerUser: cfg.SwaggerPass}), ginSwagger.WrapHandler(swaggerFiles.Handler))
		} else {
			r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		}
	}

	// GraphQL endpoint
	if gqlHandler, err := graphqlapi.NewHandler(workoutService); err == nil {
		api.POST("/graphql",
			middleware.JWTMiddleware(),
			middleware.RateLimitMiddleware(rateLimiter, 180, "graphql"), // 180 messages per IP
			gqlHandler.ServeGraphQL,
		)
		// GraphQL Playground
		if cfg.DevelopmentMode {
			r.GET("/playground", func(c *gin.Context) {
				playground.Handler("GraphQL Playground", "/api/graphql").ServeHTTP(c.Writer, c.Request)
			})
		}
	} else {
		panic(err)
	}

	return r
}
