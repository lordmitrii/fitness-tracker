package idem

import (
	"context"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"github.com/lordmitrii/golang-web-gin/internal/domain/events"
)


func TryProcess(ctx context.Context, db *gorm.DB, handler, eventType, entityKey string, action func(ctx context.Context) error) error {
	rec := events.HandlerLog{
		Handler:   handler,
		EventType: eventType,
		EntityKey: entityKey,
	}

	tx := db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&rec)
	if tx.Error != nil {
		return fmt.Errorf("idempotency insert failed: %w", tx.Error)
	}
	if tx.RowsAffected == 0 {
		return nil
	}
	return action(ctx)
}
