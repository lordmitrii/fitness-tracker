package user

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"time"
)

type User struct {
	ID           uint   `gorm:"primaryKey" json:"-"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`

	Roles []rbac.Role `gorm:"many2many:user_roles" json:"roles"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`

	CreatedAt time.Time `json:"created_at"`
}
