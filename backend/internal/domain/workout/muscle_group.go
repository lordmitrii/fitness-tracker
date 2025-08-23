package workout

import (
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type MuscleGroup struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null"`
	Slug string `gorm:"uniqueIndex;not null"`
}

func (m *MuscleGroup) BeforeCreate(tx *gorm.DB) (err error) {
	if m.Slug == "" {
		m.Slug = slug.Make(m.Name)
	}
	return nil
}
