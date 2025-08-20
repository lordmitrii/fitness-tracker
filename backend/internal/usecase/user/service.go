package user

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

type userServiceImpl struct {
	authRepo        user.UserRepository
	profileRepo     user.ProfileRepository
	userConsentRepo user.UserConsentRepository
	roleRepo        rbac.RoleRepository
	permissionRepo  rbac.PermissionRepository
}

func NewUserService(
	ur user.UserRepository,
	pr user.ProfileRepository,
	ucr user.UserConsentRepository,
	roleRepo rbac.RoleRepository,
	permissionRepo rbac.PermissionRepository,
) *userServiceImpl {
	return &userServiceImpl{
		authRepo:        ur,
		profileRepo:     pr,
		userConsentRepo: ucr,
		roleRepo:        roleRepo,
		permissionRepo:  permissionRepo,
	}
}
