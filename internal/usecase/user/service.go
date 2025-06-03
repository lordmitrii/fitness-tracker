package user

import (
	"context"
	"errors"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"golang.org/x/crypto/bcrypt"
)

var ErrUserNotFound = errors.New("user not found")

// Service orchestrates auth and profile use-cases.
type userServiceImpl struct {
	authRepo    user.UserRepository
	profileRepo user.ProfileRepository
}

// NewService creates a new user service.
func NewUserService(ur user.UserRepository, pr user.ProfileRepository) *userServiceImpl {
	return &userServiceImpl{authRepo: ur, profileRepo: pr}
}

// Register creates a new AuthUser with hashed password.
func (s *userServiceImpl) Register(ctx context.Context, email, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u := &user.User{Email: email, PasswordHash: string(hash)}
	return s.authRepo.Create(ctx, u)
}

// Authenticate verifies credentials.
func (s *userServiceImpl) Authenticate(ctx context.Context, email, password string) (*user.User, error) {
	u, err := s.authRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return nil, ErrUserNotFound
	}
	return u, nil
}

// func (s * userServiceImpl) DeleteUser(ctx context.Context, id uint) error {
// 	return s.authRepo.Delete(ctx, id)
// }

// CreateProfile associates metadata with a user.
func (s *userServiceImpl) CreateProfile(ctx context.Context, p *user.Profile) error {
	return s.profileRepo.Create(ctx, p)
}

// GetProfile retrieves a user's profile.
func (s *userServiceImpl) GetProfile(ctx context.Context, userID uint) (*user.Profile, error) {
	return s.profileRepo.GetByUserID(ctx, userID)
}

// UpdateProfile modifies existing profile.
func (s *userServiceImpl) UpdateProfile(ctx context.Context, p *user.Profile) error {
	return s.profileRepo.Update(ctx, p)
}

// DeleteProfile removes a user's profile.
func (s *userServiceImpl) DeleteProfile(ctx context.Context, id uint) error {
	return s.profileRepo.Delete(ctx, id)
}
