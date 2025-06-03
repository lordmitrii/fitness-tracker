package workout

import (
	"time"
)

type Workout struct {
	ID               uint               `gorm:"primaryKey" json:"id"`
	Name             string             `json:"name"`
	WorkoutCycleID   uint               `json:"workout_cycle_id"`
	Date             time.Time          `json:"date" example:"2010-10-01T10:00:00Z"`
	WorkoutExercises []*WorkoutExercise `json:"workout_exercises" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Index            int                `json:"index"`
	Completed        bool               `json:"completed" gorm:"default:false"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
