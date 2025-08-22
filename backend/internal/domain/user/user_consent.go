package user

import "time"

type UserConsent struct {
	ID uint `gorm:"primaryKey" json:"id"`

	UserID uint `json:"user_id" gorm:"uniqueIndex:idx_user_id_type;not null"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	Type    string `json:"type" gorm:"uniqueIndex:idx_user_id_type;not null"`
	Version string `json:"version"`
	Given   bool   `json:"given"`

	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}
