package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) user.UserRepository {
	return &UserRepo{db}
}

func (r *UserRepo) Create(ctx context.Context, u *user.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	var u user.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByUsername(ctx context.Context, username string) (*user.User, error) {
	var u user.User
	if err := r.db.WithContext(ctx).Where("username = ?", username).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uint) (*user.User, error) {
	var u user.User
	if err := r.db.WithContext(ctx).Preload("Roles").Where("id = ?", id).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrUserNotFound
	}
	return nil
}

func (r *UserRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*user.User, error) {
	var user user.User
	res := r.db.WithContext(ctx).
		Model(&user).Where("id = ?", id).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrUserNotFound
	}
	return &user, nil
}

func (r *UserRepo) UpdateByEmail(ctx context.Context, email string, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&user.User{}).Where("email = ?", email).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrUserNotFound
	}
	return nil
}

func (r *UserRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&user.User{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrUserNotFound
	}
	return nil
}

func (r *UserRepo) CheckEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&user.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *UserRepo) GetUsers(ctx context.Context, q string, page, pageSize int64, sortBy, sortDir string) ([]*user.User, int64, error) {
	var users []*user.User
	var total int64

	db := r.db.WithContext(ctx).Model(&user.User{})
	if q != "" {
		query := "%" + q + "%"
		db = db.Where("username ILIKE ? OR email ILIKE ? ", query, query)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	col := map[string]string{
		"last_seen_at": "last_seen_at",
		"created_at":   "created_at",
		"email":        "email",
	}[strings.ToLower(sortBy)]
	if col == "" {
		col = "last_seen_at"
	}

	dir := strings.ToUpper(sortDir)
	if dir != "ASC" && dir != "DESC" {
		dir = "DESC"
	}

	order := fmt.Sprintf("%s %s NULLS LAST", col, dir)

	if err := db.Offset(int((page - 1) * pageSize)).Limit(int(pageSize)).Preload("Roles.Permissions").Order(order).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
