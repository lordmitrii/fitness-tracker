package workout

import "time"

type Workout struct {
	// @ReadOnly
	ID       uint    `gorm:"primaryKey" json:"-"`
	UserID   uint    `json:"-"`
	Exercise string  `json:"exercise"`
	Weight   float64 `json:"weight"`
	Reps     int     `json:"reps"`

	// @ReadOnly
	CreatedAt time.Time `json:"-"   example:"2010-10-01T10:00:00Z"`
}
