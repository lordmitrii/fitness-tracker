package workout

import (
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type Exercise struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Name         string `json:"name" gorm:"uniqueIndex;not null"`
	IsBodyweight bool   `json:"is_bodyweight" gorm:"default:false"`
	IsTimeBased  bool   `json:"is_time_based" gorm:"default:false"`

	MuscleGroupID *uint        `json:"muscle_group_id"`
	MuscleGroup   *MuscleGroup `json:"muscle_group" gorm:"foreignKey:MuscleGroupID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	Slug string `json:"slug" gorm:"uniqueIndex;not null"`
}

func (e *Exercise) BeforeCreate(tx *gorm.DB) (err error) {
	if e.Slug == "" {
		e.Slug = slug.Make(e.Name)
	}
	return nil
}
