package postgres

import (
	"context"
	"errors"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"

	"gorm.io/gorm"
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
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error; err != nil {
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
