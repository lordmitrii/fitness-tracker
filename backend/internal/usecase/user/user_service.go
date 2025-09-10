package user

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"golang.org/x/crypto/bcrypt"
	"time"
)

func (s *userServiceImpl) Register(ctx context.Context, username, email, password string, privacyConsent, healthDataConsent bool, privacyPolicyVersion, healthDataPolicyVersion string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u := &user.User{Username: username, Email: email, PasswordHash: string(hash)}

	if !privacyConsent || !healthDataConsent {
		return custom_err.ErrNoConsent
	}

	err = s.authRepo.Create(ctx, u)
	if err != nil {
		return err
	}

	healthCons := &user.UserConsent{
		UserID:  u.ID,
		Type:    "health_data",
		Given:   healthDataConsent,
		Version: healthDataPolicyVersion,
	}

	privacyCons := &user.UserConsent{
		UserID:  u.ID,
		Type:    "user_privacy",
		Given:   privacyConsent,
		Version: privacyPolicyVersion,
	}

	err = s.userConsentRepo.Create(ctx, healthCons)
	if err != nil {
		return err
	}

	err = s.userConsentRepo.Create(ctx, privacyCons)
	if err != nil {
		return err
	}

	err = s.settingsRepo.Create(ctx, &user.UserSettings{UserID: u.ID})
	if err != nil {
		return err
	}

	err = s.roleRepo.AssignRoleToUser(ctx, u.ID, rbac.RoleRestricted)
	if err != nil {
		return err
	}

	return nil
}

// Authenticate verifies credentials.
func (s *userServiceImpl) Authenticate(ctx context.Context, username, password string) (*user.User, error) {
	u, err := s.authRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return nil, custom_err.ErrUserNotFound
	}
	return u, nil
}

func (s *userServiceImpl) Me(ctx context.Context, userID uint) (*user.User, error) {
	return s.authRepo.GetByID(ctx, userID)
}

func (s *userServiceImpl) UpdateAccount(ctx context.Context, userID uint, updates map[string]any) (*user.User, error) {
	return s.authRepo.UpdateReturning(ctx, userID, updates)
}

func (s *userServiceImpl) TouchLastSeen(ctx context.Context, userID uint) error {
	return s.authRepo.Update(ctx, userID, map[string]any{"last_seen_at": time.Now()})
}
