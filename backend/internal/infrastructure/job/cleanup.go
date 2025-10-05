package job

import (
	"context"
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"github.com/lordmitrii/golang-web-gin/internal/domain/events"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
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

	runOnce := func() {
		j.CleanTokens(ctx)
		j.CleanSoftDeletedUsers(ctx)
		j.CleanOldHandlerLogs(ctx)
	}

	// Run immediately
	runOnce()

	for {
		select {
		case <-ctx.Done():
			log.Println("Cleanup job stopped")
			return
		case <-ticker.C:
			log.Println("Running cleanup job...")
			runOnce()
		}
	}
}

func (j *CleanupJob) CleanTokens(ctx context.Context) (int64, error) {
	now := time.Now().UTC()

	res := j.db.WithContext(ctx).
		Where("expires_at < ?", now).
		Delete(&email.EmailToken{})
	if res.Error != nil {
		log.Println("Failed to clean expired tokens:", res.Error)
		return 0, res.Error
	}
	return res.RowsAffected, nil
}

func (j *CleanupJob) CleanSoftDeletedUsers(ctx context.Context) (int64, error) {
	const batchSize = 1000
	cutoff := time.Now().UTC().Add(-30 * 24 * time.Hour)
	var totalDeleted int64

	for {
		var ids []uint
		if err := j.db.WithContext(ctx).
			Model(&user.User{}).Unscoped().
			Where("deleted_at IS NOT NULL AND deleted_at < ?", cutoff).
			Limit(batchSize).Pluck("id", &ids).Error; err != nil {
			return totalDeleted, err
		}

		if len(ids) == 0 {
			break
		}

		res := j.db.WithContext(ctx).Unscoped().
			Where("id IN ?", ids).
			Delete(&user.User{})
		if res.Error != nil {
			return totalDeleted, res.Error
		}

		totalDeleted += res.RowsAffected
		log.Printf("Deleted %d soft-deleted users in batch (total: %d)\n", res.RowsAffected, totalDeleted)

		time.Sleep(100 * time.Millisecond)

		select {
		case <-ctx.Done():
			return totalDeleted, ctx.Err()
		default:
		}
	}
	return totalDeleted, nil
}

func (j *CleanupJob) CleanOldHandlerLogs(ctx context.Context) (int64, error) {
	const batchSize = 1000
	cutoff := time.Now().UTC().Add(-30 * 24 * time.Hour) // 30 days
	var totalDeleted int64
	
	for {
		res := j.db.WithContext(ctx).
			Where("created_at < ?", cutoff).
			Limit(batchSize).
			Delete(&events.HandlerLog{})
		if res.Error != nil {
			return totalDeleted, res.Error
		}
		
		if res.RowsAffected == 0 {
			break
		}
		
		totalDeleted += res.RowsAffected
		log.Printf("Deleted %d old handler logs in batch (total: %d)\n", res.RowsAffected, totalDeleted)
		
		time.Sleep(100 * time.Millisecond)
		
		select {
		case <-ctx.Done():
			return totalDeleted, ctx.Err()
		default:
		}
	}
	
	return totalDeleted, nil
}
