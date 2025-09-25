package versions

import "fmt"

func VersionTranslationKey(locale, namespace string) string {
	return fmt.Sprintf("i18n:%s:%s", locale, namespace)
}
