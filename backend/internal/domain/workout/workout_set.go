package workout

import "time"

type WorkoutSet struct {
	ID                uint `gorm:"primaryKey"`
	WorkoutExerciseID uint
	Index             int

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	Weight *int
	Reps    *int

	PreviousWeight *int
	PreviousReps    *int

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
