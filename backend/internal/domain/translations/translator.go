package translations

type Translator interface {
	Translate(key, lang string) string
}