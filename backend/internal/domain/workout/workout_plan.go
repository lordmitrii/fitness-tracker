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

	UserID uint      `gorm:"not null"`
	User   user.User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	WorkoutCycles  []*WorkoutCycle `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CurrentCycleID *uint  

	CreatedAt *time.Time     `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time     `example:"2010-10-01T10:00:00Z"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
