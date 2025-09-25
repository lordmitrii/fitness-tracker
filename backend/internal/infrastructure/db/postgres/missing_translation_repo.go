package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"gorm.io/gorm"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
)

type missingTranslationsRepo struct {
	db *gorm.DB
}

func NewMissingTranslationsRepo(db *gorm.DB) translations.MissingTranslationRepository {
	return &missingTranslationsRepo{
		db: db,
	}
}

func (r *missingTranslationsRepo) Create(ctx context.Context, translation *translations.MissingTranslation) error {
	return r.db.WithContext(ctx).Create(translation).Error
}

func (r *missingTranslationsRepo) CreateBatch(ctx context.Context, translations []*translations.MissingTranslation) error {
	return r.db.WithContext(ctx).Create(translations).Error
}

func (r *missingTranslationsRepo) GetByNamespaceAndLocaleAndKey(ctx context.Context, namespace, locale, key string) (*translations.MissingTranslation, error) {
	var translation translations.MissingTranslation
	if err := r.db.WithContext(ctx).Where("namespace = ? AND locale = ? AND key = ?", namespace, locale, key).First(&translation).Error; err != nil {
		return nil, err
	}
	return &translation, nil
}

func (r *missingTranslationsRepo) GetAll(ctx context.Context) ([]*translations.MissingTranslation, error) {
	var translationsList []*translations.MissingTranslation
	if err := r.db.WithContext(ctx).Find(&translationsList).Error; err != nil {
		return nil, err
	}
	return translationsList, nil
}

func (r *missingTranslationsRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&translations.MissingTranslation{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
