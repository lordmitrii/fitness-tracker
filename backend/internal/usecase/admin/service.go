package admin

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type adminServiceImpl struct {
	userRepo user.UserRepository
	roleRepo rbac.RoleRepository
	emailSvc usecase.EmailService
}

func NewAdminService(
	userRepo user.UserRepository,
	roleRepo rbac.RoleRepository,
	emailSvc usecase.EmailService,
) *adminServiceImpl {
	return &adminServiceImpl{
		userRepo: userRepo,
		roleRepo: roleRepo,
		emailSvc: emailSvc,
	}
}
