package rbac

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

type rbacServiceImpl struct {
	roleRepo       rbac.RoleRepository
	permissionRepo rbac.PermissionRepository
	userRepo       user.UserRepository
}

func NewRBACService(
	roleRepo rbac.RoleRepository,
	permissionRepo rbac.PermissionRepository,
	userRepo user.UserRepository,
) *rbacServiceImpl {
	return &rbacServiceImpl{
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		userRepo:       userRepo,
	}
}
