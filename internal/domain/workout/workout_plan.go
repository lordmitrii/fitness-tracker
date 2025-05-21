package workout

import "time"

type WorkoutPlan struct {
	// @ReadOnly
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	UserID uint   `json:"user_id" gorm:"constraint:OnDelete:CASCADE;"`

	WorkoutCycles []*WorkoutCycle `json:"workout_cycles"`

	// @ReadOnly
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	// @ReadOnly
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
