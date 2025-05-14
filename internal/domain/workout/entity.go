package workout

import "time"

type Workout struct {
	ID        uint      `gorm:"primaryKey" json:"id"`       
	UserID    uint      `json:"user_id"`
	Exercise  string    `json:"exercise"`
	Weight    float64   `json:"weight"`
	Reps      int       `json:"reps"`
	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
}
