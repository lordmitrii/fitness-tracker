package workout

import (
	"time"
)

type WorkoutPlan struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	UserID uint   `json:"user_id" gorm:"constraint:OnDelete:CASCADE;"`
	

	WorkoutCycles  []*WorkoutCycle `json:"workout_cycles" gorm:"foreignKey:WorkoutPlanID;"`
	CurrentCycleID uint            `gorm:"-" json:"current_cycle_id,omitempty"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
