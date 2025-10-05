package postgres

import (
	"fmt"
	"os"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"github.com/lordmitrii/golang-web-gin/internal/domain/events"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// initializes a GORM DB connection using the given DS
func NewPostgresDB(dsn string) (*gorm.DB, error) {
	var logLevel logger.LogLevel

	if os.Getenv("DEVELOPMENT_MODE") == "true" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Warn
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}
	return db, nil
}

// AutoMigrate applies schema migrations for all models.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&events.HandlerLog{},
		&versions.Version{},
		&translations.Translation{},
		&translations.MissingTranslation{},

		&user.User{},
		&user.Profile{},
		&user.UserConsent{},
		&user.UserSettings{},

		&rbac.Role{}, &rbac.UserRole{},
		&rbac.Permission{}, &rbac.RolePermission{},

		&email.EmailToken{},
		
		&workout.MuscleGroup{},
		&workout.Exercise{},
		&workout.IndividualExercise{},

		&workout.WorkoutPlan{},
		&workout.WorkoutCycle{},
		&workout.Workout{},
		&workout.WorkoutExercise{},
		&workout.WorkoutSet{},
	)

}
