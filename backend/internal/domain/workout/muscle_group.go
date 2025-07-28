package workout

import (
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type MuscleGroup struct {
	ID   uint   `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"uniqueIndex;not null"`
	Slug string `json:"slug" `
	//gorm:"uniqueIndex;not null"
}

func (m *MuscleGroup) BeforeCreate(tx *gorm.DB) (err error) {
	if m.Slug == "" {
		m.Slug = slug.Make(m.Name)
	}
	return nil
}
