package email

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type emailServiceImpl struct {
	userService    usecase.UserService
	emailSender    email.EmailSender
	emailTokenRepo email.EmailTokenRepository
}

func generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func NewEmailService(userService usecase.UserService, emailSender email.EmailSender, emailTokenRepo email.EmailTokenRepository) *emailServiceImpl {
	return &emailServiceImpl{
		userService:    userService,
		emailSender:    emailSender,
		emailTokenRepo: emailTokenRepo,
	}
}

func (s *emailServiceImpl) SendNotificationEmail(ctx context.Context, to, subject, body string) error {
	return s.emailSender.SendNotificationEmail(to, subject, body)
}

func (s *emailServiceImpl) SendVerificationEmail(ctx context.Context, to string) error {
	// Generate a random verification code
	code, err := generateCode()
	if err != nil {
		return err
	}

	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		Email:     to,
		Token:     code,
		Type:      "verification",
		ExpiresAt: time.Now().Add(15 * time.Minute),
	})

	if err != nil {
		return err
	}

	return s.emailSender.SendVerificationEmail(to, code)
}

func (s *emailServiceImpl) SendResetPasswordEmail(ctx context.Context, to string) error {
	token, err := generateToken()
	if err != nil {
		return err
	}

	err = s.emailTokenRepo.Create(ctx, &email.EmailToken{
		Email:     to,
		Token:     token,
		Type:      "reset_password",
		ExpiresAt: time.Now().Add(15 * time.Minute),
	})

	if err != nil {
		return err
	}

	link := fmt.Sprintf("https://ftrackerapp.co.uk/reset-password?token=%s", token)
	return s.emailSender.SendResetPasswordEmail(to, link)
}

func (s *emailServiceImpl) VerifyToken(ctx context.Context, token, tokenType string) (bool, error) {
	emailToken, err := s.emailTokenRepo.GetByTokenAndType(ctx, token, tokenType)
	if err != nil {
		return false, err
	}
	if emailToken == nil || emailToken.IsExpired() {
		return false, nil
	}

	if tokenType == "verification" {
		s.userService.SetVerified(ctx, emailToken.Email)
	}

	s.emailTokenRepo.Delete(ctx, emailToken.ID)
	return true, nil
}
