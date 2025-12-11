package app

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/job"
	"gorm.io/gorm"
)

// StartCleanup launches the periodic cleanup job
func StartCleanup(cfg Config, db *gorm.DB) {
	if cfg.DevelopmentMode {
		return
	}

	cleanupJob := job.NewCleanupJob(db)
	ctx, cancel := context.WithCancel(context.Background())
	go cleanupJob.Run(ctx, cfg.CleanupInterval)
	// cancellation is tied to process lifetime so we keep cancel in scope for later shutdown hooks
	_ = cancel
}
