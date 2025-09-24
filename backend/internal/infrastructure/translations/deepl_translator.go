package translations

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
)

type DeeplTranslator struct {
	AuthKey string
	URL     string
}

func NewDeepLTranslator(authKey string, url string) translations.Translator {
	return &DeeplTranslator{
		AuthKey: authKey,
		URL:     url,
	}
}

func (t *DeeplTranslator) Translate(key, lang string) string {
	// Dummy implementation for example purposes
	return key + " in " + lang
}
