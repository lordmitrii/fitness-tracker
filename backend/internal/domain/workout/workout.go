package workout

import (
	"time"
)

type Workout struct {
	ID               uint       `gorm:"primaryKey"`
	Name             string     `gorm:"not null"`
	WorkoutCycleID   uint       `gorm:"not null"`
	Date             *time.Time `example:"2010-10-01T10:00:00Z"`
	Index            int       `gorm:"not null"`
	WorkoutExercises []*WorkoutExercise `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	PreviousWorkoutID *uint

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
