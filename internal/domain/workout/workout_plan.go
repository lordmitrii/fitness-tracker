package workout

import "time"

type WorkoutPlan struct {
	// @ReadOnly
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	UserID uint   `json:"user_id"`

	Workouts []*Workout `json:"workouts"`

	// @ReadOnly
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	// @ReadOnly
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
