package user

import (
	"time"
)

type User struct {
	ID           uint   `gorm:"primaryKey" json:"-"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`

	CreatedAt time.Time `json:"-"`
}
