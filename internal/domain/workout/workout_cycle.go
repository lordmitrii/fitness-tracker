package workout

import (
	"time"
	)

type WorkoutCycle struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	Name          string      `json:"name"`
	WorkoutPlanID uint        `json:"workout_plan_id" gorm:"constraint:OnDelete:CASCADE;"`
	WeekNumber    int         `json:"week_number" gorm:"default:1;uniqueIndex"`
	Workouts      []*Workout  `json:"workouts"`
	Completed	  bool        `json:"completed" gorm:"default:false"`
	
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}