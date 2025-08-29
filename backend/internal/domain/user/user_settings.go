package user

type UserSettings struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"uniqueIndex"`

	UnitSystem         string `gorm:"default:'metric'"`
	BetaOptIn          bool   `gorm:"default:false"`
	EmailNotifications bool   `gorm:"default:false"`
}
