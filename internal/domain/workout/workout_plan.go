package workout

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"time"
)

type WorkoutPlan struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`

	UserID uint      `json:"user_id"`
	User   user.User `json:"-" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	WorkoutCycles  []*WorkoutCycle `json:"workout_cycles" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CurrentCycleID uint            `json:"current_cycle_id,omitempty"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}
