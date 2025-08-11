package rbac

const (
	RoleAdmin      = "admin"
	RoleMember     = "member"
	RoleVerified   = "verified"
	RoleRestricted = "restricted"
)

type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"not null;uniqueIndex:idx_role_name" json:"name"`
	Permissions []Permission `gorm:"many2many:role_permissions" json:"permissions"`
}

type UserRole struct {
	UserID uint `gorm:"primaryKey"`
	RoleID uint `gorm:"primaryKey"`
}
