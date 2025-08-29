package dto

import "time"

type RegisterRequest struct {
	Email                   string `binding:"required,email,max=256"`
	Password                string `binding:"required,min=8,max=129"`
	PrivacyConsent          bool   `json:"privacy_consent" binding:"required"`
	PrivacyPolicyVersion    string `json:"privacy_policy_version" binding:"required"`
	HealthDataConsent       bool   `json:"health_data_consent" binding:"required"`
	HealthDataPolicyVersion string `json:"health_data_policy_version" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=2000"`
	Password string `json:"password" binding:"required,min=8,max=2000"`
}

type ProfileCreateRequest struct {
	Age      int     `json:"age" binding:"min=16,max=150"`
	HeightCm float64 `json:"height_cm" binding:"min=20,max=500"`
	WeightKg float64 `json:"weight_kg" binding:"min=20,max=500"`
	Sex      string  `json:"sex"`
}

type ProfileUpdateRequest struct {
	Age      int     `json:"age" binding:"omitempty,min=16,max=150"`
	HeightCm float64 `json:"height_cm" binding:"omitempty,min=20,max=500"`
	WeightKg float64 `json:"weight_kg" binding:"omitempty,min=20,max=500"`
	Sex      string  `json:"sex" binding:"omitempty"`
}

type ConsentRequest struct {
	Type    string `json:"type" binding:"required"`
	Version string `json:"version" binding:"required"`
	Given   bool   `json:"given" binding:"required"`
}

type DeleteConsentRequest struct {
	Type    string `json:"type" binding:"required"`
	Version string `json:"version" binding:"required"`
}

type UserSettingsCreateRequest struct {
	UnitSystem         string `json:"unit_system" binding:"oneof=metric imperial"`
	BetaOptIn          bool   `json:"beta_opt_in"`
	EmailNotifications bool   `json:"email_notifications"`
}

type UserSettingsUpdateRequest struct {
	UnitSystem         *string `json:"unit_system" binding:"omitempty,oneof=metric imperial"`
	BetaOptIn          *bool   `json:"beta_opt_in" binding:"omitempty"`
	EmailNotifications *bool   `json:"email_notifications" binding:"omitempty"`
}

type ProfileResponse struct {
	Age       int        `json:"age"`
	HeightCm  float64    `json:"height_cm"`
	WeightKg  float64    `json:"weight_kg"`
	Sex       string     `json:"sex"`
	UpdatedAt *time.Time `json:"updated_at"`
	CreatedAt *time.Time `json:"created_at"`
}

type ConsentResponse struct {
	ID        uint       `json:"id"`
	UserID    uint       `json:"user_id"`
	Type      string     `json:"type"`
	Version   string     `json:"version"`
	Given     bool       `json:"given"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

type MeResponse struct {
	Email      string         `json:"email"`
	Roles      []RoleResponse `json:"roles"`
	IsVerified bool           `json:"is_verified"`
}

type UserSettingsResponse struct {
	UnitSystem         string `json:"unit_system"`
	BetaOptIn          bool   `json:"beta_opt_in"`
	EmailNotifications bool   `json:"email_notifications"`
}
