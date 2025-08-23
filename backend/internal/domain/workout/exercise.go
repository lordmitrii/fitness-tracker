package workout

import (
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type Exercise struct {
	ID           uint   `gorm:"primaryKey"`
	Name         string `gorm:"uniqueIndex;not null"`
	IsBodyweight bool   `gorm:"default:false"`
	IsTimeBased  bool   `gorm:"default:false"`

	MuscleGroupID *uint
	MuscleGroup   *MuscleGroup `gorm:"foreignKey:MuscleGroupID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;"`

	Slug string `gorm:"uniqueIndex;not null"`
}

func (e *Exercise) BeforeCreate(tx *gorm.DB) (err error) {
	if e.Slug == "" {
		e.Slug = slug.Make(e.Name)
	}
	return nil
}
