package admin

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type adminServiceImpl struct {
	userRepo user.UserRepository
	roleRepo rbac.RoleRepository
	emailSvc usecase.EmailService
}

func NewAdminService(userRepo user.UserRepository, roleRepo rbac.RoleRepository, emailSvc usecase.EmailService) *adminServiceImpl {
	return &adminServiceImpl{
		userRepo: userRepo,
		roleRepo: roleRepo,
		emailSvc: emailSvc,
	}
}

func (s *adminServiceImpl) ListUsers(ctx context.Context, q string, page, pageSize int64) ([]*user.User, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 200 {
		pageSize = 20
	}

	users, total, err := s.userRepo.GetUsers(ctx, q, page, pageSize)
	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (s *adminServiceImpl) ListRoles(ctx context.Context) ([]*rbac.Role, error) {
	roles, err := s.roleRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (s *adminServiceImpl) SetUserRoles(ctx context.Context, userID uint, roleNames []string) error {
	err := s.roleRepo.ClearUserRoles(ctx, userID)
	if err != nil {
		return err
	}

	for _, roleName := range roleNames {
		role, err := s.roleRepo.GetByName(ctx, roleName)
		if err != nil {
			return err
		}
		err = s.roleRepo.AssignRoleToUser(ctx, userID, role.Name)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *adminServiceImpl) TriggerResetUserPassword(ctx context.Context, userID uint) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	return s.emailSvc.SendResetPasswordEmail(ctx, user.Email)
}

func (s *adminServiceImpl) DeleteUser(ctx context.Context, userID uint) error {
	err := s.userRepo.Delete(ctx, userID)
	if err != nil {
		return err
	}
	return nil
}
