package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
)

type UserSettingsRepo struct {
	db *gorm.DB
}

func NewUserSettingsRepo(db *gorm.DB) user.UserSettingsRepository {
	return &UserSettingsRepo{db}
}

func (r *UserSettingsRepo) Create(ctx context.Context, us *user.UserSettings) error {
	return r.db.Create(us).Error
}

func (r *UserSettingsRepo) GetByUserID(ctx context.Context, userID uint) (*user.UserSettings, error) {
	var settings user.UserSettings
	if err := r.db.Where("user_id = ?", userID).First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &settings, nil
}

func (r *UserSettingsRepo) Update(ctx context.Context, userID uint, updates map[string]any) error {
	if len(updates) == 0 {
		return nil 
	}

	res := r.db.Model(&user.UserSettings{}).Where("user_id = ?", userID).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *UserSettingsRepo) Delete(ctx context.Context, userID uint) error {
	res := r.db.Delete(&user.UserSettings{}, userID)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
