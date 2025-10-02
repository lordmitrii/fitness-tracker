package workout

import (
	"time"
)

type WorkoutCycle struct {
	ID            uint       `gorm:"primaryKey"`
	Name          string     `gorm:"not null"`
	WorkoutPlanID uint       `gorm:"not null;index;uniqueIndex:idx_workout_plan_week_number"`
	WeekNumber    int        `gorm:"default:1;uniqueIndex:idx_workout_plan_week_number"`
	Workouts      []*Workout `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	PreviousCycleID *uint `gorm:"index"`
	NextCycleID     *uint `gorm:"index"`

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	CreatedAt *time.Time
	UpdatedAt *time.Time
}
