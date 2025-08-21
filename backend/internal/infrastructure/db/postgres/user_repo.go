package postgres

import (
	"context"
	"errors"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
	"time"
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

func (r *UserRepo) Update(ctx context.Context, u *user.User) error {
	res := r.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", u.ID).Updates(u)
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

func (r *UserRepo) SetVerified(ctx context.Context, email string) error {
	res := r.db.WithContext(ctx).Model(&user.User{}).Where("email = ?", email).Update("is_verified", true)
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

func (r *UserRepo) GetUsers(ctx context.Context, q string, page, pageSize int64) ([]*user.User, int64, error) {
	var users []*user.User
	var total int64

	db := r.db.WithContext(ctx).Model(&user.User{})
	if q != "" {
		db = db.Where("email ILIKE ?", "%"+q+"%")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.Offset(int((page - 1) * pageSize)).Limit(int(pageSize)).Preload("Roles.Permissions").Order("last_seen_at, created_at").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *UserRepo) TouchLastSeen(ctx context.Context, userID uint) error {
	return r.db.WithContext(ctx).Model(&user.User{}).Where("id = ?", userID).Update("last_seen_at", time.Now()).Error
}
