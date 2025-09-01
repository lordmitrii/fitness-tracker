package postgres

import (
	"context"
	"errors"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProfileRepo struct {
	db *gorm.DB
}

func NewProfileRepo(db *gorm.DB) user.ProfileRepository {
	return &ProfileRepo{db}
}

func (r *ProfileRepo) Create(ctx context.Context, p *user.Profile) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *ProfileRepo) GetByUserID(ctx context.Context, userID uint) (*user.Profile, error) {
	var p user.Profile
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrProfileNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *ProfileRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&user.Profile{}).Where("user_id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrProfileNotFound
	}
	return nil
}

func (r *ProfileRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*user.Profile, error) {
	var p user.Profile
	res := r.db.WithContext(ctx).Model(&p).Where("user_id = ?", id).Clauses(clause.Returning{}).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrProfileNotFound
	}
	return &p, nil
}

func (r *ProfileRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&user.Profile{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrProfileNotFound
	}
	return nil
}
