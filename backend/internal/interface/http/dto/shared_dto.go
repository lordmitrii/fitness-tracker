package dto

type MessageResponse struct {
	Message string `json:"message"`
}

type RoleResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}