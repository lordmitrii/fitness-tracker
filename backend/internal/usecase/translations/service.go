package translations

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
)

type translationServiceImpl struct {
	translationRepo        translations.TranslationRepository
	missingTranslationRepo translations.MissingTranslationRepository
	versionRepo            versions.VersionRepository
}

func NewTranslationService(tr translations.TranslationRepository, mtr translations.MissingTranslationRepository, vr versions.VersionRepository) *translationServiceImpl {
	return &translationServiceImpl{
		translationRepo:        tr,
		missingTranslationRepo: mtr,
		versionRepo:            vr,
	}
}
