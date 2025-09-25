package versions

import (
	"fmt"
	"time"
)

type Version struct {
	ID        uint   `gorm:"primaryKey"`
	Key       string `gorm:"uniqueIndex"`
	Version   string `gorm:"default:'1.0.0'"`
	CreatedAt *time.Time
	UpdatedAt *time.Time
}

func (v *Version) Increment() {
	var major, minor, patch int
	n, err := fmt.Sscanf(v.Version, "%d.%d.%d", &major, &minor, &patch)
	if n != 3 || err != nil {
		return
	}
	patch++
	v.Version = fmt.Sprintf("%d.%d.%d", major, minor, patch)
}
