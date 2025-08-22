package email

import "time"

type EmailToken struct {
	ID        uint       `json:"id" gorm:"primaryKey"`
	Email     string     `json:"email"`
	Token     string     `json:"token"`
	Type      string     `json:"type"`
	ExpiresAt *time.Time  `json:"expires_at"`
	CreatedAt *time.Time `json:"created_at"`
}

func (et *EmailToken) IsExpired() bool {
	return time.Now().After(*et.ExpiresAt)
}
