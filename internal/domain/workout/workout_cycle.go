package workout

import (
	"time"
	// "gorm.io/gorm"
	)

type WorkoutCycle struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	Name          string      `json:"name"`
	WorkoutPlanID uint        `json:"workout_plan_id" gorm:"constraint:OnDelete:CASCADE;"`
	Workouts      []*Workout  `json:"workouts"`
	Completed	  bool        `json:"completed" gorm:"default:false"`
	
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}

func (wc *WorkoutCycle) BeforeCreate() (err error) {
	if wc.Name == "" {
		wc.Name = "New Cycle"
	}
	return nil
}