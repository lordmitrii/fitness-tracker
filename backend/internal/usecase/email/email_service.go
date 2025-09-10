package email

import (
	"context"
	"fmt"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"golang.org/x/crypto/bcrypt"
)

func (s *emailServiceImpl) SendNotificationEmail(ctx context.Context, to, subject, body string) error {
	exists, err := s.userRepo.CheckEmail(ctx, to)
	if err != nil {
		return nil
	}
	if !exists {
		return nil
	}

	return s.emailSender.SendNotificationEmail(to, subject, body, "en")
}

func (s *emailServiceImpl) SendVerificationEmail(ctx context.Context, to, lang string) error {
	user, err := s.userRepo.GetByEmail(ctx, to)
	if err != nil && err == custom_err.ErrUserNotFound {
		return nil
	} else if err != nil {
		return err
	}

	// Generate a random verification code
	code, err := generateCode()
	if err != nil {
		return err
	}

	t := time.Now().Add(15 * time.Minute)
	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		UserID:    user.ID,
		Token:     code,
		Type:      "verification",
		ExpiresAt: &t,
	})

	if err != nil {
		return err
	}

	return s.emailSender.SendVerificationEmail(to, code, lang)
}

func (s *emailServiceImpl) SendResetPasswordEmail(ctx context.Context, to, lang string) error {
	user, err := s.userRepo.GetByEmail(ctx, to)
	if err != nil && err == custom_err.ErrUserNotFound {
		return nil
	} else if err != nil {
		return err
	}

	token, err := generateToken()
	if err != nil {
		return err
	}

	t := time.Now().Add(15 * time.Minute)
	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		UserID:    user.ID,
		Token:     token,
		Type:      "reset_password",
		ExpiresAt: &t,
	})

	if err != nil {
		return err
	}

	link := fmt.Sprintf("https://ftrackerapp.co.uk/reset-password?token=%s&spinner=false", token)
	return s.emailSender.SendResetPasswordEmail(to, link, lang)
}

func (s *emailServiceImpl) ValidateToken(ctx context.Context, token, tokenType string) (bool, error) {
	emailToken, err := s.emailTokenRepo.GetByTokenAndType(ctx, token, tokenType)
	if err != nil {
		return false, err
	}
	if emailToken == nil || emailToken.IsExpired() {
		return false, nil
	}

	return true, nil
}

func (s *emailServiceImpl) VerifyAccount(ctx context.Context, token string) error {
	emailToken, err := s.emailTokenRepo.GetByTokenAndType(ctx, token, "verification")
	if err != nil {
		return err
	}
	if emailToken == nil || emailToken.IsExpired() {
		return nil
	}

	err = s.roleRepo.RemoveRoleFromUser(ctx, emailToken.UserID, rbac.RoleRestricted)
	if err != nil {
		return err
	}

	err = s.roleRepo.AssignRoleToUser(ctx, emailToken.UserID, rbac.RoleVerified)
	if err != nil {
		return err
	}

	err = s.userRepo.Update(ctx, emailToken.UserID, map[string]any{"is_verified": true})
	if err != nil {
		return err
	}

	s.emailTokenRepo.Delete(ctx, emailToken.ID)
	return nil
}

func (s *emailServiceImpl) ResetPassword(ctx context.Context, token, newPassword string) error {
	emailToken, err := s.emailTokenRepo.GetByTokenAndType(ctx, token, "reset_password")
	if err != nil {
		return err
	}
	if emailToken == nil || emailToken.IsExpired() {
		return fmt.Errorf("invalid or expired token")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = s.userRepo.Update(ctx, emailToken.UserID, map[string]any{"password_hash": string(hash)})
	if err != nil {
		return err
	}

	s.emailTokenRepo.Delete(ctx, emailToken.ID)
	return nil
}
