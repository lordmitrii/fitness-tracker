package rbac

import (
	"context"
)

type RoleRepository interface {
	Create(ctx context.Context, role *Role) error
	GetByName(ctx context.Context, roleName string) (*Role, error)
	Update(ctx context.Context, role *Role) error
	Delete(ctx context.Context, roleName string) error
	GetAll(ctx context.Context) ([]*Role, error)

	GetUserRoles(ctx context.Context, userID uint) ([]*Role, error)
	AssignRoleToUser(ctx context.Context, userID uint, roleName string) error
	RemoveRoleFromUser(ctx context.Context, userID uint, roleName string) error
}

type PermissionRepository interface {
	Create(ctx context.Context, permission *Permission) error
	GetByKey(ctx context.Context, permKey string) (*Permission, error)
	Update(ctx context.Context, permission *Permission) error
	Delete(ctx context.Context, permKey string) error
	GetAll(ctx context.Context) ([]*Permission, error)

	GetRolePermissionsByRoleID(ctx context.Context, roleName string) ([]*Permission, error)
	AssignPermissionToRole(ctx context.Context, roleName, permKey string) error
	RemovePermissionFromRole(ctx context.Context, roleName, permKey string) error

	GetUserPermissions(ctx context.Context, userID uint) ([]*Permission, error)
}
