package events

import "time"

type HandlerLog struct {
	Handler   string `gorm:"primaryKey"`
	EventType string `gorm:"primaryKey"`
	EntityKey string `gorm:"primaryKey"`
	CreatedAt time.Time
}
