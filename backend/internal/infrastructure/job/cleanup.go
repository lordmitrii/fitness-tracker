package job

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"gorm.io/gorm"
	"log"
	"time"
)

type CleanupJob struct {
	db *gorm.DB
}

func NewCleanupJob(db *gorm.DB) *CleanupJob {
	return &CleanupJob{db: db}
}

func (j *CleanupJob) Run(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Cleanup job stopped")
			return
		case <-ticker.C:
			log.Println("Running cleanup job...")
			if err := j.db.Where("expires_at < ?", time.Now()).Delete(&email.EmailToken{}).Error; err != nil {
				log.Println("Failed to clean expired tokens:", err)
			} else {
				log.Println("Expired tokens cleaned up")
			}
		}
	}
}
