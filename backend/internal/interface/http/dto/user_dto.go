package dto

import "time"

// swagger:model
type RegisterRequest struct {
	Username                string `json:"username" binding:"required,min=5,max=55" example:"ada_lovelace"`
	Email                   string `json:"email"    binding:"required,email,max=256" example:"ada@example.com"`
	Password                string `json:"password" binding:"required,min=8,max=129" example:"StrongP@ssw0rd"`
	PrivacyConsent          bool   `json:"privacy_consent"           binding:"required" example:"true"`
	PrivacyPolicyVersion    string `json:"privacy_policy_version"    binding:"required" example:"2025-01"`
	HealthDataConsent       bool   `json:"health_data_consent"       binding:"required" example:"true"`
	HealthDataPolicyVersion string `json:"health_data_policy_version" binding:"required" example:"2025-01"`
}

// swagger:model
type LoginRequest struct {
	Username string `json:"username" binding:"required,max=256" example:"ada_lovelace"`
	Password string `json:"password" binding:"required,min=8,max=256" example:"StrongP@ssw0rd"`
}

// swagger:model
type AccountUpdateRequest struct {
	Username *string `json:"username" binding:"omitempty,min=5,max=55" example:"ada_l"`
	Email    *string `json:"email"    binding:"omitempty,email,max=256" example:"ada.new@example.com"`
	Password *string `json:"password" binding:"omitempty,min=8,max=129" example:"EvenStrongerP@ss1"`
}

// swagger:model
type ProfileCreateRequest struct {
	Age    int    `json:"age"    binding:"min=16,max=150" example:"28"`
	Height int    `json:"height" binding:"min=200,max=5000" example:"1720"`      // mm
	Weight int    `json:"weight" binding:"min=20000,max=500000" example:"65000"` // grams
	Sex    string `json:"sex"    example:"female"`
}

// swagger:model
type ProfileUpdateRequest struct {
	Age    *int    `json:"age"    binding:"omitempty,min=16,max=150" example:"29"`
	Height *int    `json:"height" binding:"omitempty,min=200,max=5000" example:"1730"`
	Weight *int    `json:"weight" binding:"omitempty,min=20000,max=500000" example:"64000"`
	Sex    *string `json:"sex"    binding:"omitempty" example:"female"`
}

// swagger:model
type ConsentRequest struct {
	Type    string `json:"type"    binding:"required" example:"privacy_policy"`
	Version string `json:"version" binding:"required" example:"2025-01"`
	Given   bool   `json:"given"   binding:"required" example:"true"`
}

// swagger:model
type DeleteConsentRequest struct {
	Type    string `json:"type"    binding:"required" example:"privacy_policy"`
	Version string `json:"version" binding:"required" example:"2025-01"`
}

// swagger:model
type UserSettingsCreateRequest struct {
	UnitSystem         string `json:"unit_system"         binding:"oneof=metric imperial" example:"metric"`
	BetaOptIn          bool   `json:"beta_opt_in"         example:"false"`
	EmailNotifications bool   `json:"email_notifications" example:"true"`
	CalculateCalories  bool   `json:"calculate_calories"  example:"true"`
}

// swagger:model
type UserSettingsUpdateRequest struct {
	UnitSystem         *string `json:"unit_system"         binding:"omitempty,oneof=metric imperial" example:"imperial"`
	BetaOptIn          *bool   `json:"beta_opt_in"         binding:"omitempty" example:"true"`
	EmailNotifications *bool   `json:"email_notifications" binding:"omitempty" example:"false"`
	CalculateCalories  *bool   `json:"calculate_calories"  binding:"omitempty" example:"false"`
}

// swagger:model
type ProfileResponse struct {
	Age       int        `json:"age"        example:"28"`
	Height    int        `json:"height"     example:"1720"`
	Weight    int        `json:"weight"     example:"65000"`
	Sex       string     `json:"sex"        example:"female"`
	UpdatedAt *time.Time `json:"updated_at" example:"2025-09-20T12:34:56Z"`
	CreatedAt *time.Time `json:"created_at" example:"2025-01-02T15:04:05Z"`
}

// swagger:model
type ConsentResponse struct {
	ID        uint       `json:"id"         example:"11"`
	UserID    uint       `json:"user_id"    example:"42"`
	Type      string     `json:"type"       example:"privacy_policy"`
	Version   string     `json:"version"    example:"2025-01"`
	Given     bool       `json:"given"      example:"true"`
	CreatedAt *time.Time `json:"created_at" example:"2025-01-03T10:00:00Z"`
	UpdatedAt *time.Time `json:"updated_at" example:"2025-06-10T09:00:00Z"`
}

// swagger:model
type TokenResponse struct {
	AccessToken  string `json:"access_token"  example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string `json:"refresh_token,omitempty" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// swagger:model
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"omitempty"`
}

// swagger:model
type MeResponse struct {
	Username   string         `json:"username"   example:"ada_lovelace"`
	Email      string         `json:"email"      example:"ada@example.com"`
	Roles      []RoleResponse `json:"roles"`
	IsVerified bool           `json:"is_verified" example:"true"`
}

// swagger:model
type UserSettingsResponse struct {
	UnitSystem         string `json:"unit_system"         example:"metric"`
	BetaOptIn          bool   `json:"beta_opt_in"         example:"false"`
	EmailNotifications bool   `json:"email_notifications" example:"true"`
	CalculateCalories  bool   `json:"calculate_calories"  example:"true"`
}

// swagger:model
type AccountResponse struct {
	Username string `json:"username" example:"ada_l"`
	Email    string `json:"email"    example:"ada.new@example.com"`
}
