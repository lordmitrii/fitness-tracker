package user

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"golang.org/x/crypto/bcrypt"
)

type userServiceImpl struct {
	authRepo        user.UserRepository
	profileRepo     user.ProfileRepository
	userConsentRepo user.UserConsentRepository
	roleRepo        rbac.RoleRepository
	permissionRepo  rbac.PermissionRepository
}

func NewUserService(ur user.UserRepository, pr user.ProfileRepository, ucr user.UserConsentRepository, roleRepo rbac.RoleRepository, permissionRepo rbac.PermissionRepository) *userServiceImpl {
	return &userServiceImpl{authRepo: ur, profileRepo: pr, userConsentRepo: ucr, roleRepo: roleRepo, permissionRepo: permissionRepo}
}

func (s *userServiceImpl) Register(ctx context.Context, email, password string, privacyConsent, healthDataConsent bool, privacyPolicyVersion, healthDataPolicyVersion string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u := &user.User{Email: email, PasswordHash: string(hash)}

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

	err = s.roleRepo.AssignRoleToUser(ctx, u.ID, rbac.RoleRestricted)
	if err != nil {
		return err
	}

	return nil
}

// Authenticate verifies credentials.
func (s *userServiceImpl) Authenticate(ctx context.Context, email, password string) (*user.User, error) {
	u, err := s.authRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return nil, custom_err.ErrUserNotFound
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

func (s *userServiceImpl) GetConsents(ctx context.Context, userID uint) ([]*user.UserConsent, error) {
	return s.userConsentRepo.GetByUserID(ctx, userID)
}

func (s *userServiceImpl) CreateConsent(ctx context.Context, consent *user.UserConsent) error {
	return s.userConsentRepo.Create(ctx, consent)
}

func (s *userServiceImpl) UpdateConsent(ctx context.Context, consent *user.UserConsent) error {
	return s.userConsentRepo.Update(ctx, consent)
}

func (s *userServiceImpl) DeleteConsent(ctx context.Context, userID uint, consentType, version string) error {
	return s.userConsentRepo.DeleteByUserIDAndType(ctx, userID, consentType, version)
}

func (s *userServiceImpl) SetVerified(ctx context.Context, email string) error {
	user, err := s.authRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}

	err = s.roleRepo.RemoveRoleFromUser(ctx, user.ID, rbac.RoleRestricted)
	if err != nil {
		return err
	}

	err = s.roleRepo.AssignRoleToUser(ctx, user.ID, rbac.RoleVerified)
	if err != nil {
		return err
	}

	return s.authRepo.SetVerified(ctx, email)
}

func (s *userServiceImpl) CheckEmail(ctx context.Context, email string) (bool, error) {
	exists, err := s.authRepo.CheckEmail(ctx, email)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (s *userServiceImpl) ResetPassword(ctx context.Context, email, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.authRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hash)
	return s.authRepo.Update(ctx, user)
}
