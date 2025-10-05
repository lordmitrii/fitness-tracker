package user

import (
	"time"
)

const (
	SexMale   = "male"
	SexFemale = "female"
)

type Profile struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"uniqueIndex;not null"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	Age    int
	Height int
	Weight int
	Sex    string

	UpdatedAt *time.Time
	CreatedAt *time.Time
}
