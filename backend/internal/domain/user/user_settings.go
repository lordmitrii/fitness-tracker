package user

type UserSettings struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"uniqueIndex;not null"`

	UnitSystem         string `gorm:"default:'metric'"`
	BetaOptIn          bool   `gorm:"default:false"`
	EmailNotifications bool   `gorm:"default:false"`
	CalculateCalories  bool   `gorm:"default:true"`
}
