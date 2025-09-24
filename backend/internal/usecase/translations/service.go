package translations

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
)

type translationServiceImpl struct {
	translationRepo        translations.TranslationRepository
	missingTranslationRepo translations.MissingTranslationRepository
}

func NewTranslationService(tr translations.TranslationRepository, mtr translations.MissingTranslationRepository) *translationServiceImpl {
	return &translationServiceImpl{
		translationRepo:        tr,
		missingTranslationRepo: mtr,
	}
}
