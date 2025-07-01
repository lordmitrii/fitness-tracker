package workout

import (
	"time"
)

type WorkoutCycle struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	Name            string        `json:"name"`
	WorkoutPlanID   uint          `json:"workout_plan_id" gorm:"uniqueIndex:idx_workout_plan_week_number;"`
	WeekNumber      int           `json:"week_number" gorm:"default:1;uniqueIndex:idx_workout_plan_week_number;"`
	Workouts        []*Workout    `json:"workouts" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Completed       bool          `json:"completed" gorm:"default:false"`
	PreviousCycleID uint          `json:"previous_cycle_id,omitempty"`
	NextCycleID     uint          `json:"next_cycle_id,omitempty"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
