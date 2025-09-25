package translations

import (
	"time"
)

type MissingTranslation struct {
	ID        uint   `gorm:"primaryKey"`
	Namespace string `gorm:"uniqueIndex:idx_namespace_locale_key"`
	Locale    string `gorm:"uniqueIndex:idx_namespace_locale_key"`
	Key       string `gorm:"uniqueIndex:idx_namespace_locale_key"`
	CreatedAt *time.Time
	UpdatedAt *time.Time
}