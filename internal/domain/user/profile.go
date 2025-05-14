package user

type Profile struct {
	// @ReadOnly
    ID        uint    `gorm:"primaryKey" json:"id"`
    UserID    uint    `gorm:"uniqueIndex;not null" json:"user_id"`
    Age       int     `json:"age"`
    HeightCm  float64 `json:"height_cm"`
    WeightKg  float64 `json:"weight_kg"`
    Gender    string  `json:"gender"`
}