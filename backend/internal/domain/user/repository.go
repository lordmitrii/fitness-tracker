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
}

type ProfileRepository interface {
	Create(ctx context.Context, p *Profile) error
	GetByUserID(ctx context.Context, userID uint) (*Profile, error)
	Update(ctx context.Context, p *Profile) error
	Delete(ctx context.Context, id uint) error
}
