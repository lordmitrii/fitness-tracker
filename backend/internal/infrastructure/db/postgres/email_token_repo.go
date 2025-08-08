package postgres

import (
	"context"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"gorm.io/gorm"
)

type EmailTokenRepo struct {
	db *gorm.DB
}

func NewEmailTokenRepo(db *gorm.DB) *EmailTokenRepo {
	return &EmailTokenRepo{db: db}
}

func (r *EmailTokenRepo) Create(ctx context.Context, token *email.EmailToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *EmailTokenRepo) GetByTokenAndType(ctx context.Context, token, tokenType string) (*email.EmailToken, error) {
	var emailToken email.EmailToken
	err := r.db.WithContext(ctx).Where("token = ? AND type = ?", token, tokenType).First(&emailToken).Error
	if err != nil {
		return nil, err
	}
	return &emailToken, nil
}

func (r *EmailTokenRepo) DeleteExpiredTokens(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Delete(&email.EmailToken{}).Error
}

func (r *EmailTokenRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&email.EmailToken{}).Error
}
