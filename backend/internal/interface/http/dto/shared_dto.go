package dto

// swagger:model
type MessageResponse struct {
	Message string `json:"message" example:"Operation successful"`
}

// swagger:model
type RoleResponse struct {
	ID   uint   `json:"id" example:"1"`
	Name string `json:"name" example:"admin"`
}
