package workout

import "time"

type WorkoutSet struct {
	ID                uint `gorm:"primaryKey"`
	WorkoutExerciseID uint
	Index             int

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	Weight *float64
	Reps   *int

	PreviousWeight *float64
	PreviousReps   *int

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
