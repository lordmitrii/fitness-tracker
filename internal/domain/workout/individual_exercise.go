package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"time"
)

type IndividualExercise struct {
	ID   uint   `json:"id"              gorm:"primaryKey"`
	Name string `json:"name"            gorm:"uniqueIndex:idx_name_user_id;not null"`

	MuscleGroupID *uint        `json:"muscle_group_id"`
	MuscleGroup   *MuscleGroup `json:"muscle_group"    gorm:"foreignKey:MuscleGroupID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	CurrentWeight float64 `json:"current_weight"  gorm:"-"`
	CurrentReps   int     `json:"current_reps"    gorm:"-"`

	UserID uint      `json:"user_id"            gorm:"uniqueIndex:idx_name_user_id;not null"`
	User   user.User `json:"-"                  gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ExerciseID *uint     `json:"exercise_id"`
	Exercise   *Exercise `json:"exercise"       gorm:"foreignKey:ExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	CreatedAt time.Time `json:"created_at"      example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"      example:"2010-10-01T10:00:00Z"`
}
