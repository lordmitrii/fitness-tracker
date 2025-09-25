package translations

import (
	"time"
)

var ISO2Locale = map[string]string{
	"EN": "en",
	"RU": "ru",
	"ZH": "zh", 
}

type Translation struct {
	ID        uint           `gorm:"primaryKey"`
	Namespace string         `gorm:"uniqueIndex:idx_namespace_locale_key"`
	Locale    string         `gorm:"uniqueIndex:idx_namespace_locale_key"`
	Key       string         `gorm:"uniqueIndex:idx_namespace_locale_key"`
	Value     string         
	CreatedAt *time.Time      
	UpdatedAt *time.Time     
}
