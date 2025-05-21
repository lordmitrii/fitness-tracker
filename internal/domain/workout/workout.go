package workout

import "time"

type Workout struct {
	// @ReadOnly
	ID            uint        `gorm:"primaryKey" json:"id"`
	Name          string      `json:"name"`
	WorkoutPlanID uint        `json:"workout_plan_id"`
	Date          time.Time   `json:"date" example:"2010-10-01T10:00:00Z"`
	Exercises     []*Exercise `json:"exercises" gorm:"constraint:OnDelete:CASCADE;OnUpdate:CASCADE;"`
	// @ReadOnly
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	// @ReadOnly
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
