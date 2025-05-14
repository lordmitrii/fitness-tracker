package postgres

import (
    "fmt"
    "github.com/lordmitrii/golang-web-gin/internal/domain/workout"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// initializes a GORM DB connection using the given DS
func NewPostgresDB(dsn string) (*gorm.DB, error) {
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, fmt.Errorf("failed to connect to postgres: %w", err)
    }
    return db, nil
}

// AutoMigrate applies schema migrations for all models.
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(&workout.Workout{})
}