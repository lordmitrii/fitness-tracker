package dto

type VersionResponse struct {
	ID      uint   `json:"id"`
	Key     string `json:"key"`
	Version string `json:"version"`
}