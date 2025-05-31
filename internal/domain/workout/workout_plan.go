package workout

import (
	"fmt"
	"time"
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type WorkoutPlan struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	UserID uint   `json:"user_id" gorm:"constraint:OnDelete:CASCADE;"`
	Slug  string `json:"slug" gorm:"uniqueIndex;not null"`

	WorkoutCycles []*WorkoutCycle `json:"workout_cycles"`
	CurrentCycleID  uint    `gorm:"-" json:"current_cycle_id,omitempty"`

	CreatedAt time.Time `json:"created_at"   example:"2010-10-01T10:00:00Z"`
	UpdatedAt time.Time `json:"updated_at"   example:"2010-10-01T10:00:00Z"`
}

func (p *WorkoutPlan) BeforeCreate(tx *gorm.DB) (err error) {
    if p.Slug == "" {
        base := slug.Make(p.Name)
        unique := base
        var count int64
        i := 1
        for {
            tx.Model(&WorkoutPlan{}).
                Where("user_id = ? AND slug = ?", p.UserID, unique).
                Count(&count)
            if count == 0 {
                break
            }
            i++
            unique = fmt.Sprintf("%s-%d", base, i)
        }
        p.Slug = unique
    }
    return nil
}
