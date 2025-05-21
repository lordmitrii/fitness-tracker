package user

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"-"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	CreatedAt    time.Time `json:"-"`

	// One-to-one relation:
	Profile *Profile `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}
