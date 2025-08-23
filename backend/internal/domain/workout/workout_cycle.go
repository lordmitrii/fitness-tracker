package workout

import (
	"time"
)

type WorkoutCycle struct {
	ID            uint       `gorm:"primaryKey"`
	Name          string     `gorm:"not null"`
	WorkoutPlanID uint       `gorm:"uniqueIndex:idx_workout_plan_week_number;"`
	WeekNumber    int        `gorm:"default:1;uniqueIndex:idx_workout_plan_week_number;"`
	Workouts      []*Workout `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	PreviousCycleID *uint
	NextCycleID     *uint

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
