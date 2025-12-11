package translations

import (
	"context"
)

type TranslationRepository interface {
	Create(ctx context.Context, translation *Translation) error
	GetByID(ctx context.Context, id uint) (*Translation, error)
	Update(ctx context.Context, id uint, updates map[string]any) error
	Delete(ctx context.Context, id uint) error
	GetByNamespaceAndLocale(ctx context.Context, namespace, locale string) ([]*Translation, error)
}

type MissingTranslationRepository interface {
	Create(ctx context.Context, translation *MissingTranslation) error
	CreateBatch(ctx context.Context, translations []*MissingTranslation) error
	GetByNamespaceAndLocaleAndKey(ctx context.Context, namespace, locale, key string) (*MissingTranslation, error)
	GetAll(ctx context.Context) ([]*MissingTranslation, error)
	Delete(ctx context.Context, id uint) error
}
