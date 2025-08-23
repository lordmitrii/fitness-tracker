package user

import (
	"time"
)

type Profile struct {
	ID uint `gorm:"primaryKey"`

	UserID uint `gorm:"uniqueIndex;not null"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	Age      int     
	HeightCm float64 
	WeightKg float64 
	Sex      string  

	UpdatedAt *time.Time 
	CreatedAt *time.Time 
}
