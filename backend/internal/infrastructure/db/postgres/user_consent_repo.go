package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
)

type userConsentRepo struct {
	db *gorm.DB
}

func NewUserConsentRepository(db *gorm.DB) user.UserConsentRepository {
	return &userConsentRepo{db: db}
}

func (r *userConsentRepo) Create(ctx context.Context, uc *user.UserConsent) error {
	return r.db.WithContext(ctx).Create(uc).Error
}

func (r *userConsentRepo) GetByUserID(ctx context.Context, userID uint) ([]*user.UserConsent, error) {
	var ucs []*user.UserConsent
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&ucs).Error; err != nil {
		return nil, err
	}
	return ucs, nil
}

func (r *userConsentRepo) Update(ctx context.Context, uc *user.UserConsent) error {
	res := r.db.WithContext(ctx).Model(&user.UserConsent{}).Where("user_id = ?", uc.UserID).Updates(uc)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *userConsentRepo) DeleteByUserIDAndType(ctx context.Context, userID uint, consentType, version string) error {
	res := r.db.WithContext(ctx).Where("user_id = ? AND type = ? AND version = ?", userID, consentType, version).Delete(&user.UserConsent{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
