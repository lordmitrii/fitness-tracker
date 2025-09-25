package user

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID           uint   `gorm:"primaryKey"`
	Username     string `gorm:"uniqueIndex; not null"` 
	Email        string `gorm:"uniqueIndex"`
	PasswordHash string `gorm:"not null"`

	Roles []rbac.Role `gorm:"many2many:user_roles"`

	IsVerified bool `gorm:"default:false"`

	LastSeenAt time.Time
	UpdatedAt  time.Time
	CreatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
}
