package workout

import (
	"time"
	"fmt"
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type Workout struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	Name          string      `json:"name"`
	Slug		  string      `json:"slug" gorm:"uniqueIndex;not null"`
	WorkoutCycleID uint        `json:"workout_cycle_id" gorm:"constraint:OnDelete:CASCADE;"`
	Date          time.Time   `json:"date" example:"2010-10-01T10:00:00Z"`
	WorkoutExercises     []*WorkoutExercise `json:"workout_exercises"`
	Index         int         `json:"index"`
	Completed	  bool        `json:"completed" gorm:"default:false"`
	
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}

func (w *Workout) BeforeCreate(tx *gorm.DB) (err error) {
	if w.Slug == "" {
		base := slug.Make(w.Name)
		unique := base
		var count int64
		i := 1
		for {
			tx.Model(&Workout{}).
				Where("workout_cycle_id = ? AND slug = ?", w.WorkoutCycleID, unique).
				Count(&count)
			if count == 0 {
				break
			}
			i++
			unique = fmt.Sprintf("%s-%d", base, i)
		}
		w.Slug = unique
	}
	return nil
}
