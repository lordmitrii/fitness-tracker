package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"gorm.io/gorm"
)

type PermissionRepo struct {
	db *gorm.DB
}

func NewPermissionRepo(db *gorm.DB) rbac.PermissionRepository {
	return &PermissionRepo{db: db}
}

func (r *PermissionRepo) Create(ctx context.Context, permission *rbac.Permission) error {
	return r.db.WithContext(ctx).Create(permission).Error
}

func (r *PermissionRepo) GetByKey(ctx context.Context, permKey string) (*rbac.Permission, error) {
	var permission rbac.Permission
	err := r.db.WithContext(ctx).First(&permission, "key = ?", permKey).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

func (r *PermissionRepo) Update(ctx context.Context, permission *rbac.Permission) error {
	res := r.db.WithContext(ctx).Model(&rbac.Permission{}).Where("id = ?", permission.ID).Updates(permission)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *PermissionRepo) Delete(ctx context.Context, permKey string) error {
	res := r.db.WithContext(ctx).Where("key = ?", permKey).Delete(&rbac.Permission{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *PermissionRepo) GetAll(ctx context.Context) ([]*rbac.Permission, error) {
	var permissions []*rbac.Permission
	err := r.db.WithContext(ctx).Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

func (r *PermissionRepo) GetRolePermissionsByRoleID(ctx context.Context, roleName string) ([]*rbac.Permission, error) {
	var permissions []*rbac.Permission
	err := r.db.WithContext(ctx).Table("permissions").
		Select("permissions.*").
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Where("role_permissions.role_id = (SELECT id FROM roles WHERE name = ?)", roleName).
		Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

func (r *PermissionRepo) AssignPermissionToRole(ctx context.Context, roleName, permKey string) error {
	var role rbac.Role
	err := r.db.WithContext(ctx).Model(&rbac.Role{}).Where("name = ?", roleName).First(&role).Error
	if err != nil {
		return err
	}
	var permission rbac.Permission
	err = r.db.WithContext(ctx).Model(&rbac.Permission{}).Where("key = ?", permKey).First(&permission).Error
	if err != nil {
		return err
	}
	var rolePermission = rbac.RolePermission{
		RoleID:       role.ID,
		PermissionID: permission.ID,
	}
	res := r.db.WithContext(ctx).Create(&rolePermission)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (r *PermissionRepo) RemovePermissionFromRole(ctx context.Context, roleName, permKey string) error {
	var role rbac.Role
	err := r.db.WithContext(ctx).Model(&rbac.Role{}).Where("name = ?", roleName).First(&role).Error
	if err != nil {
		return err
	}
	var permission rbac.Permission
	err = r.db.WithContext(ctx).Model(&rbac.Permission{}).Where("key = ?", permKey).First(&permission).Error
	if err != nil {
		return err
	}
	var rolePermission = rbac.RolePermission{
		RoleID:       role.ID,
		PermissionID: permission.ID,
	}
	res := r.db.WithContext(ctx).Delete(&rolePermission)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (r *PermissionRepo) GetUserPermissions(ctx context.Context, userID uint) ([]*rbac.Permission, error) {
	var permissions []*rbac.Permission
	err := r.db.WithContext(ctx).Model(&rbac.Permission{}).
		Table("permissions").
		Select("DISTINCT permissions.*").
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Joins("JOIN user_roles ON user_roles.role_id = role_permissions.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}
