package workout

type Exercise struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	Name      		string  `json:"name"`
	MuscleGroup     string  `json:"muscle_group"`
}