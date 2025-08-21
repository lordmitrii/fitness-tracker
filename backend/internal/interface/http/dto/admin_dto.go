package dto

import "time"

type SetRolesRequest struct {
	RoleNames []string `json:"role_names"`
}

type UserResponse struct {
	ID         uint           `json:"id"`
	Email      string         `json:"email"`
	IsVerified bool           `json:"is_verified"`
	LastSeenAt time.Time      `json:"last_seen_at"`
	CreatedAt  time.Time      `json:"created_at"`
	Roles      []RoleResponse `json:"roles"`
}

type ListUserResponse struct {
	Users []UserResponse `json:"users"`
	Total int64          `json:"total"`
}
