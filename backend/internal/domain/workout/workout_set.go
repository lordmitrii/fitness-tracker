package workout

import "time"

type WorkoutSet struct {
	ID                uint `gorm:"primaryKey"`
	WorkoutExerciseID uint `gorm:"index;index:idx_we__index,priority:1"`
	Index             int  `gorm:"index:idx_we__index,priority:2"`

	Completed bool `gorm:"default:false;index"` 
	Skipped   bool `gorm:"default:false;index"`

	Weight *int
	Reps   *int

	PreviousWeight *int
	PreviousReps   *int

	CreatedAt *time.Time
	UpdatedAt *time.Time
}
