package workout

import (
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
)

type WorkoutPlan struct {
	ID     uint   `gorm:"primaryKey"`
	Name   string `gorm:"not null"`
	Active bool   `gorm:"default:false"`

	UserID uint      `gorm:"not null;index"` 
	User   user.User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	WorkoutCycles  []*WorkoutCycle `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CurrentCycleID *uint           `gorm:"index"` 

	CreatedAt *time.Time
	UpdatedAt *time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
