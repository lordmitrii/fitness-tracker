package email

import "time"

type EmailToken struct {
	ID        uint       
	Email     string    
	Token     string     
	Type      string     
	ExpiresAt *time.Time  
	CreatedAt *time.Time 
}

func (et *EmailToken) IsExpired() bool {
	return time.Now().After(*et.ExpiresAt)
}
