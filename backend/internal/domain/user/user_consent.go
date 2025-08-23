package user

import "time"

type UserConsent struct {
	ID uint `gorm:"primaryKey"`

	UserID uint `gorm:"uniqueIndex:idx_user_id_type;not null"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	Type    string `gorm:"uniqueIndex:idx_user_id_type;not null"`
	Version string
	Given   bool

	CreatedAt *time.Time
	UpdatedAt *time.Time
}
