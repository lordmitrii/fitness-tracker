package email

import (
	"context"
	"fmt"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
)

func (s *emailServiceImpl) SendNotificationEmail(ctx context.Context, to, subject, body string) error {
	exists, err := s.userService.CheckEmail(ctx, to)
	if err != nil {
		return nil
	}
	if !exists {
		return nil
	}

	return s.emailSender.SendNotificationEmail(to, subject, body, "en")
}

func (s *emailServiceImpl) SendVerificationEmail(ctx context.Context, to, lang string) error {
	exists, err := s.userService.CheckEmail(ctx, to)
	if err != nil {
		return nil
	}
	if !exists {
		return nil
	}

	// Generate a random verification code
	code, err := generateCode()
	if err != nil {
		return err
	}

	t := time.Now().Add(15 * time.Minute)
	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		Email:     to,
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
	exists, err := s.userService.CheckEmail(ctx, to)
	if err != nil {
		return nil
	}
	if !exists {
		return nil
	}

	token, err := generateToken()
	if err != nil {
		return err
	}

	t := time.Now().Add(15 * time.Minute)
	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		Email:     to,
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

	s.userService.SetVerified(ctx, emailToken.Email)
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

	err = s.userService.ResetPassword(ctx, emailToken.Email, newPassword)
	if err != nil {
		return err
	}

	s.emailTokenRepo.Delete(ctx, emailToken.ID)
	return nil
}
