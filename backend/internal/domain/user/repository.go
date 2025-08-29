package user

import (
	"context"
)

type UserRepository interface {
	Create(ctx context.Context, u *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id uint) (*User, error)
	Update(ctx context.Context, u *User) error
	Delete(ctx context.Context, id uint) error
	SetVerified(ctx context.Context, email string) error
	CheckEmail(ctx context.Context, email string) (bool, error)
	GetUsers(ctx context.Context, q string, page, pageSize int64) ([]*User, int64, error)
	TouchLastSeen(ctx context.Context, userID uint) error
}

type ProfileRepository interface {
	Create(ctx context.Context, p *Profile) error
	GetByUserID(ctx context.Context, userID uint) (*Profile, error)
	Update(ctx context.Context, p *Profile) error
	Delete(ctx context.Context, id uint) error
}

type UserConsentRepository interface {
	Create(ctx context.Context, uc *UserConsent) error
	GetByUserID(ctx context.Context, userID uint) ([]*UserConsent, error)
	Update(ctx context.Context, uc *UserConsent) error
	DeleteByUserIDAndType(ctx context.Context, userID uint, consentType, version string) error
}

type UserSettingsRepository interface {
	Create(ctx context.Context, us *UserSettings) error
	GetByUserID(ctx context.Context, userID uint) (*UserSettings, error)
	Update(ctx context.Context, userID uint, updates map[string]any) error
	Delete(ctx context.Context, id uint) error
}