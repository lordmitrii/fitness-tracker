package user

type Profile struct {
	// @ReadOnly
	ID       uint    `gorm:"primaryKey" json:"-"`
	UserID   uint    `gorm:"uniqueIndex;not null" json:"-"`
	Age      int     `json:"age"`
	HeightCm float64 `json:"height_cm"`
	WeightKg float64 `json:"weight_kg"`
	Sex   string  `json:"sex"`
}
