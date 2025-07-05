package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"time"
)

type IndividualExercise struct {
	ID          uint   `json:"id"              gorm:"primaryKey"`
	Name        string `json:"name"            gorm:"uniqueIndex:idx_name_muscle_group_user_id;not null"`
	MuscleGroup string `json:"muscle_group"    gorm:"uniqueIndex:idx_name_muscle_group_user_id;not null"`

	// TODO: remove these and add sercvice to calculate current best weight and reps
	CurrentWeight float64 `json:"current_weight"  gorm:"default:0"`
	CurrentReps   int     `json:"current_reps"    gorm:"default:0"`

	UserID uint      `json:"user_id"            gorm:"uniqueIndex:idx_name_muscle_group_user_id;not null"`
	User   user.User `json:"-"                  gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ExerciseID *uint     `json:"exercise_id"`
	Exercise   *Exercise `json:"exercise"       gorm:"foreignKey:ExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	CreatedAt time.Time `json:"created_at"      example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"      example:"2010-10-01T10:00:00Z"`
}
