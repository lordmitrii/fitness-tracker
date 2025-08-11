package admin

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

type adminServiceImpl struct {
	userRepo  user.UserRepository
	rolesRepo rbac.RoleRepository
}

func NewAdminService(userRepo user.UserRepository, roleRepo rbac.RoleRepository) *adminServiceImpl {
	return &adminServiceImpl{
		userRepo:  userRepo,
		rolesRepo: roleRepo,
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
	roles, err := s.rolesRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return roles, nil
}
