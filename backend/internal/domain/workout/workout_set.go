package workout

import "time"

type WorkoutSet struct {
	ID                uint `gorm:"primaryKey" json:"id"`
	WorkoutExerciseID uint `json:"workout_exercise_id"`
	Index             int  `json:"index"`

	Completed bool `json:"completed" gorm:"default:false"`

	Weight float64 `json:"weight"`
	Reps   int     `json:"reps"`

	PreviousWeight float64 `json:"previous_weight" gorm:"default:0"`
	PreviousReps   int     `json:"previous_reps" gorm:"default:0"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
