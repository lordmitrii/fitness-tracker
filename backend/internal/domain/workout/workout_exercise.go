package workout

import "time"

type WorkoutExercise struct {
	ID uint `gorm:"primaryKey"`

	WorkoutID uint `gorm:"not null;index:idx_workout__index,priority:1;index"`
	Index     int  `gorm:"not null;index:idx_workout__index,priority:2"`

	IndividualExerciseID uint                `gorm:"not null;index"`
	IndividualExercise   *IndividualExercise `gorm:"foreignKey:IndividualExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	WorkoutSets        []*WorkoutSet `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	PreviousExerciseID *uint         `gorm:"index"`

	Completed bool `gorm:"default:false;index"`
	Skipped   bool `gorm:"default:false;index"`

	SetsQt int64 `gorm:"-"`

	CreatedAt *time.Time
	UpdatedAt *time.Time
}
