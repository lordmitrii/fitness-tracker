package workout

import "time"

type WorkoutExercise struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	WorkoutID uint `json:"workout_id"`
	Index     int  `json:"index"`

	IndividualExerciseID uint                `json:"individual_exercise_id"`
	IndividualExercise   *IndividualExercise `json:"individual_exercise" gorm:"foreignKey:IndividualExerciseID;constraint:OnDelete:CASCADE,OnUpdate:CASCADE;"`

	WorkoutSets []*WorkoutSet `json:"workout_sets" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Completed bool  `json:"completed" gorm:"default:false"`
	Skipped   bool  `json:"skipped" gorm:"default:false"`
	
	SetsQt    int64 `json:"sets_qt" gorm:"-"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
