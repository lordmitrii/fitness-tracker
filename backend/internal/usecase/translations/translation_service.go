package translations

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
)

func (s *translationServiceImpl) GetTranslations(ctx context.Context, namespace, locale string) ([]*translations.Translation, error) {
	translations, err := s.translationRepo.GetByNamespaceAndLocale(ctx, namespace, locale)
	if err != nil {
		return nil, err
	}
	return translations, nil
}

func (s *translationServiceImpl) UpdateTranslation(ctx context.Context, id uint, updates map[string]any) error {
	return s.translationRepo.Update(ctx, id, updates)
}

func (s *translationServiceImpl) CreateTranslation(ctx context.Context, translation *translations.Translation) error {
	return s.translationRepo.Create(ctx, translation)
}	

func (s *translationServiceImpl) DeleteTranslation(ctx context.Context, id uint) error {
	return s.translationRepo.Delete(ctx, id)
}

func (s *translationServiceImpl) ReportMissingTranslations(ctx context.Context, translations []*translations.MissingTranslation) error {
	return s.missingTranslationRepo.CreateBatch(ctx, translations)
}
