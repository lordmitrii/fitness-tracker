package dto

import "time"

// swagger:model
type SetRolesRequest struct {
	RoleNames []string `json:"role_names" example:"admin,user"`
}

// swagger:model
type UserResponse struct {
	ID         uint           `json:"id" example:"1"`
	Username   string         `json:"username" example:"johndoe"`
	Email      string         `json:"email" example:"johndoe@example.com"`
	IsVerified bool           `json:"is_verified" example:"true"`
	LastSeenAt time.Time      `json:"last_seen_at" example:"2023-01-01T12:00:00Z"`
	CreatedAt  time.Time      `json:"created_at" example:"2023-01-01T12:00:00Z"`
	Roles      []RoleResponse `json:"roles"`
}

// swagger:model
type ListUserResponse struct {
	Users []UserResponse `json:"users"`
	Total int64          `json:"total" example:"123"`
}
