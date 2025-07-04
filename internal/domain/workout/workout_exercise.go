package workout

import "time"

type WorkoutExercise struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	WorkoutID uint    `json:"workout_id"`
	Index	  int     `json:"index"`
	
	IndividualExerciseID uint    `json:"individual_exercise_id"`
	IndividualExercise   *IndividualExercise `json:"individual_exercise" gorm:"foreignKey:IndividualExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	Completed bool    `json:"completed" gorm:"default:false"`
	
	Weight    float64 `json:"weight"`
	Reps      int     `json:"reps"`
	Sets      int     `json:"sets"`

	PreviousWeight float64 `json:"previous_weight" gorm:"default:0"`
	PreviousReps   int     `json:"previous_reps" gorm:"default:0"`
	PreviousSets   int     `json:"previous_sets" gorm:"default:0"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
