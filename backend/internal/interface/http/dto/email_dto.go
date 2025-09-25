package dto

// swagger:model
type SendVerificationEmailRequest struct {
	To       string `json:"to" binding:"required,email" example:"user@example.com"`
	Language string `json:"language" example:"en"`
}

// swagger:model
type SendNotificationEmailRequest struct {
	To      string `json:"to" binding:"required,email" example:"admin@example.com"`
	Subject string `json:"subject" binding:"required" example:"System maintenance"`
	Body    string `json:"body" binding:"required" example:"The system will be down for maintenance at midnight."`
}

// swagger:model
type SendResetPasswordEmailRequest struct {
	To       string `json:"to" binding:"required,email" example:"user@example.com"`
	Language string `json:"language" example:"en"`
}

// swagger:model
type ValidateTokenRequest struct {
	Token     string `json:"token" binding:"required" example:"abcd1234efgh"`
	TokenType string `json:"token_type" binding:"required" example:"reset_password"`
}

// swagger:model
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required" example:"abcd1234efgh"`
	NewPassword string `json:"new_password" binding:"required,min=8" example:"StrongP@ssw0rd"`
}

// swagger:model
type VerifyAccountRequest struct {
	Token string `json:"token" binding:"required" example:"verifytoken123"`
}
