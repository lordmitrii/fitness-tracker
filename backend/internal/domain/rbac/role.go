package rbac

const (
	RoleAdmin      = "admin"
	RoleTester     = "tester"
	RoleMember     = "member"
	RoleVerified   = "verified"
	RoleRestricted = "restricted"
)

type Role struct {
	ID          uint         `gorm:"primaryKey"`
	Name        string       `gorm:"not null;uniqueIndex:idx_role_name"`
	Permissions []Permission `gorm:"many2many:role_permissions"`
}

type UserRole struct {
	UserID uint `gorm:"primaryKey;not null;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	RoleID uint `gorm:"primaryKey;not null;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
