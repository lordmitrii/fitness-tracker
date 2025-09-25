package translations

import (
	"context"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
)

func (s *translationServiceImpl) GetTranslations(ctx context.Context, namespace, locale string) ([]*translations.Translation, error) {
	translations, err := s.translationRepo.GetByNamespaceAndLocale(ctx, namespace, locale)
	if err != nil {
		return nil, err
	}
	return translations, nil
}

func (s *translationServiceImpl) UpdateTranslation(ctx context.Context, id uint, updates map[string]any) error {
	existing, err := s.translationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("translation not found")
	}

	locale := existing.Locale
	if v, ok := updates["locale"].(string); ok && v != "" {
		locale = v
	}
	ns := existing.Namespace
	if v, ok := updates["namespace"].(string); ok && v != "" {
		ns = v
	}

	if err := s.versionRepo.BumpVersion(ctx, versions.VersionTranslationKey(locale, ns)); err != nil {
		return err
	}
	return s.translationRepo.Update(ctx, id, updates)
}

func (s *translationServiceImpl) CreateTranslation(ctx context.Context, translation *translations.Translation) error {
	if err := s.versionRepo.BumpVersion(ctx, versions.VersionTranslationKey(translation.Locale, translation.Namespace)); err != nil {
		return err
	}
	return s.translationRepo.Create(ctx, translation)
}

func (s *translationServiceImpl) DeleteTranslation(ctx context.Context, id uint) error {
	return s.translationRepo.Delete(ctx, id)
}

func (s *translationServiceImpl) ReportMissingTranslations(ctx context.Context, translations []*translations.MissingTranslation) error {
	return s.missingTranslationRepo.CreateBatch(ctx, translations)
}

func (s *translationServiceImpl) GetI18nMeta(ctx context.Context, locales, namespaces string) (map[string]map[string]string, error) {
	out := make(map[string]map[string]string, len(locales))
	for _, lng := range splitOrDefault(locales, []string{"en"}) {
		base := baseLang(lng)
		if _, ok := out[base]; !ok {
			out[base] = map[string]string{}
		}
		for _, ns := range splitOrDefault(namespaces, []string{"translation"}) {
			key := versions.VersionTranslationKey(base, ns)
			v, err := s.versionRepo.GetByKey(ctx, key)
			if err != nil || v == nil || v.Version == "" {
				out[base][ns] = "1"
				continue
			}
			out[base][ns] = v.Version
		}
	}
	return out, nil
}
