package workout

import (
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

type IndividualExercise struct {
	ID           uint   `gorm:"primaryKey"`
	Name         string `gorm:"uniqueIndex:idx_name_user_id;not null"`
	IsBodyweight bool   `gorm:"default:false"`
	IsTimeBased  bool   `gorm:"default:false"`

	MuscleGroupID *uint
	MuscleGroup   *MuscleGroup `gorm:"foreignKey:MuscleGroupID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	CurrentWeight int `gorm:"-"`
	CurrentReps   int `gorm:"-"`

	LastCompletedWorkoutExerciseID *uint
	LastCompletedWorkoutExercise   *WorkoutExercise `gorm:"foreignKey:LastCompletedWorkoutExerciseID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	UserID uint      `gorm:"uniqueIndex:idx_name_user_id;not null"`
	User   user.User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ExerciseID *uint
	Exercise   *Exercise `gorm:"foreignKey:ExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	CreatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
	UpdatedAt *time.Time `example:"2010-10-01T10:00:00Z"`
}
