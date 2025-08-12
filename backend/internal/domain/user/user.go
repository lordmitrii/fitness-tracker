package user

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID           uint   `gorm:"primaryKey" json:"-"`
	Email        string `gorm:"not null;uniqueIndex" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`

	Roles []rbac.Role `gorm:"many2many:user_roles" json:"roles"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`

	UpdatedAt time.Time      `json:"updated_at"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
