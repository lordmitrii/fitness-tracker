package app

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	DSN             string
	Port            string
	DevelopmentMode bool
	CorsAllowed     []string
	SwaggerEnabled  bool
	SwaggerUser     string
	SwaggerPass     string
	RedisAddr       string
	RedisPassword   string
	SendgridFrom    string
	SendgridAPIKey  string
	DeepLAuthKey    string
	DeepLAPIURL     string
	OpenAIKey       string
	CleanupInterval time.Duration
}

func LoadConfig() Config {
	dev := os.Getenv("DEVELOPMENT_MODE") == "true"

	cors := []string{
		"http://localhost:8081",
		"http://127.0.0.1:8081",
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	}
	if raw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS")); raw != "" {
		parts := strings.Split(raw, ",")
		cors = cors[:0]
		for _, p := range parts {
			if v := strings.TrimSpace(p); v != "" {
				cors = append(cors, v)
			}
		}
	}

	cleanupInterval := 24 * time.Hour
	if raw := os.Getenv("CLEANUP_INTERVAL_HOURS"); raw != "" {
		if hours, err := strconv.Atoi(raw); err == nil && hours > 0 {
			cleanupInterval = time.Duration(hours) * time.Hour
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://username:password@localhost:5432/fitness_tracker?sslmode=disable"
	}

	return Config{
		DSN:             dsn,
		Port:            port,
		DevelopmentMode: dev,
		CorsAllowed:     cors,
		SwaggerEnabled:  os.Getenv("SWAGGER_ENABLED") == "true",
		SwaggerUser:     os.Getenv("SWAGGER_USER"),
		SwaggerPass:     os.Getenv("SWAGGER_PASS"),
		RedisAddr:       os.Getenv("REDIS_ADDR"),
		RedisPassword:   os.Getenv("REDIS_PASSWORD"),
		SendgridFrom:    os.Getenv("SENDGRID_FROM_EMAIL"),
		SendgridAPIKey:  os.Getenv("SENDGRID_API_KEY"),
		DeepLAuthKey:    os.Getenv("DEEPL_AUTH_KEY"),
		DeepLAPIURL:     os.Getenv("DEEPL_API_URL"),
		OpenAIKey:       os.Getenv("OPENAI_API_KEY"),
		CleanupInterval: cleanupInterval,
	}
}
