package workout

import "time"

type Exercise struct {
	// @ReadOnly
	ID        uint    `gorm:"primaryKey" json:"id"`
	Name      string  `json:"name"`
	WorkoutID uint    `gorm:"constraint:OnDelete:CASCADE;" json:"workout_id"`
	Muscle    string  `json:"muscle"`
	Weight    float64 `json:"weight"`
	Reps      int     `json:"reps"`
	Sets      int     `json:"sets"`

	// @ReadOnly
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	// @ReadOnly
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
