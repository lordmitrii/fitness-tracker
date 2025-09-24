package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"gorm.io/gorm"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
)

type translationsRepo struct {
	db *gorm.DB
}

func NewTranslationsRepo(db *gorm.DB) translations.TranslationRepository {
	return &translationsRepo{
		db: db,
	}
}
func (r *translationsRepo) Create(ctx context.Context, translation *translations.Translation) error {
	return r.db.WithContext(ctx).Create(translation).Error
}

func (r *translationsRepo) GetByID(ctx context.Context, id uint) (*translations.Translation, error) {
	var translation translations.Translation
	if err := r.db.WithContext(ctx).First(&translation, id).Error; err != nil {
		return nil, err
	}
	return &translation, nil
}

func (r *translationsRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&translations.Translation{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrTranslationNotFound
	}
	return nil
}

func (r *translationsRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&translations.Translation{}, id)
	return res.Error
}

func (r *translationsRepo) GetByNamespaceAndLocale(ctx context.Context, namespace, locale string) ([]*translations.Translation, error) {
	var translationsList []*translations.Translation
	if err := r.db.WithContext(ctx).Where("namespace = ? AND locale = ?", namespace, locale).Find(&translationsList).Error; err != nil {
		return nil, err
	}
	return translationsList, nil
}