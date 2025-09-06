package dto

type SendVerificationEmailRequest struct {
	To       string `json:"to" binding:"required,email"`
	Language string `json:"language"`
}

type SendNotificationEmailRequest struct {
	To      string `json:"to" binding:"required,email"`
	Subject string `json:"subject" binding:"required"`
	Body    string `json:"body" binding:"required"`
}

type SendResetPasswordEmailRequest struct {
	To       string `json:"to" binding:"required,email"`
	Language string `json:"language"`
}

type ValidateTokenRequest struct {
	Token     string `json:"token" binding:"required"`
	TokenType string `json:"token_type" binding:"required"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type VerifyAccountRequest struct {
	Token string `json:"token" binding:"required"`
}
