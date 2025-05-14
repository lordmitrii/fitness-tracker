package postgres

import (
	"context"
	"errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"gorm.io/gorm"
)

var ErrProfileNotFound = errors.New("profile not found")

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
			return nil, ErrProfileNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *ProfileRepo) Update(ctx context.Context, p *user.Profile) error {
	res := r.db.WithContext(ctx).Model(&user.Profile{}).Where("id = ?", p.ID).Updates(p)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrProfileNotFound
	}
	return nil
}
func (r *ProfileRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&user.Profile{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrProfileNotFound
	}
	return nil
}

