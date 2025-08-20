package rbac

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
)

func (s *rbacServiceImpl) HasRole(ctx context.Context, userID uint, roleName string) (bool, error) {
	roles, err := s.roleRepo.GetUserRoles(ctx, userID)
	if err != nil {
		return false, err
	}
	for _, role := range roles {
		if role.Name == roleName {
			return true, nil
		}
	}
	return false, nil
}

func (s *rbacServiceImpl) HasPermission(ctx context.Context, userID uint, permKey string) (bool, error) {
	permissions, err := s.permissionRepo.GetUserPermissions(ctx, userID)
	if err != nil {
		return false, err
	}
	for _, perm := range permissions {
		if perm.Key == permKey {
			return true, nil
		}
	}
	return false, nil
}

func (s *rbacServiceImpl) GetUserRoles(ctx context.Context, userID uint) ([]*rbac.Role, error) {
	roles, err := s.roleRepo.GetUserRoles(ctx, userID)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (s *rbacServiceImpl) GetUserPermissions(ctx context.Context, userID uint) ([]*rbac.Permission, error) {
	permissions, err := s.permissionRepo.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}
	return permissions, nil
}
