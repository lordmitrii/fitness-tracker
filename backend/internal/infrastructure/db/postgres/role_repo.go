package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RoleRepo struct {
	db *gorm.DB
}

func NewRoleRepo(db *gorm.DB) rbac.RoleRepository {
	return &RoleRepo{db: db}
}

func (r *RoleRepo) Create(ctx context.Context, role *rbac.Role) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *RoleRepo) GetByName(ctx context.Context, roleName string) (*rbac.Role, error) {
	var role rbac.Role
	err := r.db.WithContext(ctx).Where("name = ?", roleName).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&rbac.Role{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *RoleRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*rbac.Role, error) {
	var role rbac.Role
	res := r.db.WithContext(ctx).Model(&role).Where("id = ?", id).Clauses(clause.Returning{}).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}
	return &role, nil
}

func (r *RoleRepo) Delete(ctx context.Context, roleName string) error {
	res := r.db.WithContext(ctx).Where("name = ?", roleName).Delete(&rbac.Role{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *RoleRepo) GetAll(ctx context.Context) ([]*rbac.Role, error) {
	var roles []*rbac.Role
	err := r.db.WithContext(ctx).Find(&roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *RoleRepo) GetUserRoles(ctx context.Context, userID uint) ([]*rbac.Role, error) {
	var roles []*rbac.Role
	err := r.db.WithContext(ctx).Model(&rbac.Role{}).
		Table("roles").
		Select("roles.*").
		Joins("JOIN user_roles ON user_roles.role_id = roles.id").
		Where("user_roles.user_id = ?", userID).
		Find(&roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *RoleRepo) AssignRoleToUser(ctx context.Context, userID uint, roleName string) error {
	var role rbac.Role
	err := r.db.WithContext(ctx).Model(&rbac.Role{}).Where("name = ?", roleName).First(&role).Error
	if err != nil {
		return err
	}
	var userRole = rbac.UserRole{
		UserID: userID,
		RoleID: role.ID,
	}
	err = r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "role_id"}},
			DoNothing: true,
		}).
		Create(&userRole).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *RoleRepo) RemoveRoleFromUser(ctx context.Context, userID uint, roleName string) error {
	var role rbac.Role
	err := r.db.WithContext(ctx).Model(&rbac.Role{}).Where("name = ?", roleName).First(&role).Error
	if err != nil {
		return err
	}
	var userRole = rbac.UserRole{
		UserID: userID,
		RoleID: role.ID,
	}
	res := r.db.WithContext(ctx).Delete(&userRole)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (r *RoleRepo) ClearUserRoles(ctx context.Context, userID uint) error {
	res := r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&rbac.UserRole{})
	if res.Error != nil {
		return res.Error
	}
	return nil
}
