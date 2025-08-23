package workout

import "time"

type WorkoutExercise struct {
	ID        uint `gorm:"primaryKey"`
	WorkoutID uint `gorm:"not null"`
	Index     int  `gorm:"not null"`

	IndividualExerciseID uint                `gorm:"not null"`
	IndividualExercise   *IndividualExercise `gorm:"foreignKey:IndividualExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	WorkoutSets []*WorkoutSet `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Completed bool `gorm:"default:false"`
	Skipped   bool `gorm:"default:false"`

	SetsQt int64 `gorm:"-"`

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
