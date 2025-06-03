package workout

import "time"

type WorkoutExercise struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	WorkoutID uint    `json:"workout_id"`
	Index	  int     `json:"index"`

	ExerciseID uint    `json:"exercise_id"`
	Exercise   *Exercise `json:"exercise" gorm:"foreignKey:ExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	Completed bool    `json:"completed" gorm:"default:false"`
	Weight    float64 `json:"weight"`
	Reps      int     `json:"reps"`
	Sets      int     `json:"sets"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
