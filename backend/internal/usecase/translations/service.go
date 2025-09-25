package translations

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type translationServiceImpl struct {
	translationRepo        translations.TranslationRepository
	missingTranslationRepo translations.MissingTranslationRepository
	versionRepo            versions.VersionRepository
}

func NewTranslationService(tr translations.TranslationRepository, mtr translations.MissingTranslationRepository, vr versions.VersionRepository) usecase.TranslationService {
	return &translationServiceImpl{
		translationRepo:        tr,
		missingTranslationRepo: mtr,
		versionRepo:            vr,
	}
}
