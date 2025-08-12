package user

import (
	"time"
)

type Profile struct {
	// @ReadOnly
	ID uint `gorm:"primaryKey" json:"-"`

	UserID uint `gorm:"uniqueIndex;not null" json:"-"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`

	Age      int     `json:"age"`
	HeightCm float64 `json:"height_cm"`
	WeightKg float64 `json:"weight_kg"`
	Sex      string  `json:"sex"`

	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
}
