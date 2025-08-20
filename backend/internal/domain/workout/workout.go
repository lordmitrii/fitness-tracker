package workout

import (
	"time"
)

type Workout struct {
	ID                uint               `gorm:"primaryKey" json:"id"`
	Name              string             `json:"name"`
	WorkoutCycleID    uint               `json:"workout_cycle_id"`
	Date              time.Time          `json:"date" example:"2010-10-01T10:00:00Z"`
	Index             int                `json:"index"`
	WorkoutExercises  []*WorkoutExercise `json:"workout_exercises" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Completed         bool               `json:"completed" gorm:"default:false"`
	Skipped           bool               `json:"skipped" gorm:"default:false"`

	PreviousWorkoutID uint               `json:"previous_workout_id,omitempty"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
