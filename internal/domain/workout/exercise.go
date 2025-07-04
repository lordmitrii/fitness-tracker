package workout

import (
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type Exercise struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	Name      		string  `json:"name" gorm:"uniqueIndex:idx_name_muscle_group;not null"`
	MuscleGroup     string  `json:"muscle_group" gorm:"uniqueIndex:idx_name_muscle_group;not null"`
	Slug			string  `json:"slug" gorm:"uniqueIndex;not null"`
}

func (e *Exercise) BeforeCreate(tx *gorm.DB) (err error) {
	if e.Slug == "" {
		e.Slug = slug.Make(e.Name)
	}
	return nil
}