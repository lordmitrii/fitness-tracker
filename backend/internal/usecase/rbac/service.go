package rbac

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
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
) usecase.RBACService {
	return &rbacServiceImpl{
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		userRepo:       userRepo,
	}
}
