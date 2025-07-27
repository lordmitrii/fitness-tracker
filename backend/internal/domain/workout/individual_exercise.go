package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"time"
)

type IndividualExercise struct {
	ID           uint   `json:"id"              gorm:"primaryKey"`
	Name         string `json:"name"            gorm:"uniqueIndex:idx_name_user_id;not null"`
	IsBodyweight bool   `json:"is_bodyweight"  gorm:"default:false"`
	IsTimeBased  bool   `json:"is_time_based" gorm:"default:false"`

	MuscleGroupID *uint        `json:"muscle_group_id"`
	MuscleGroup   *MuscleGroup `json:"muscle_group"    gorm:"foreignKey:MuscleGroupID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	CurrentWeight float64 `json:"current_weight"  gorm:"-"`
	CurrentReps   int     `json:"current_reps"    gorm:"-"`

	LastCompletedWorkoutExerciseID *uint            `json:"last_completed_workout_exercise_id"`
	LastCompletedWorkoutExercise   *WorkoutExercise `json:"last_completed_workout_exercise" gorm:"foreignKey:LastCompletedWorkoutExerciseID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	UserID uint      `json:"user_id"            gorm:"uniqueIndex:idx_name_user_id;not null"`
	User   user.User `json:"-"                  gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ExerciseID *uint     `json:"exercise_id"`
	Exercise   *Exercise `json:"exercise"       gorm:"foreignKey:ExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	CreatedAt time.Time `json:"created_at"      example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"      example:"2010-10-01T10:00:00Z"`
}
