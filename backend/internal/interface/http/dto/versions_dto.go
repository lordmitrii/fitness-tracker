package dto

// swagger:model
type VersionResponse struct {
	ID      uint   `json:"id"    example:"3"`
	Key     string `json:"key"   example:"mobile_app"`
	Version string `json:"version" example:"2.4.1"`
}
