package email

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type emailServiceImpl struct {
	userService    usecase.UserService
	emailSender    email.EmailSender
	emailTokenRepo email.EmailTokenRepository
}

func NewEmailService(
	userService usecase.UserService,
	emailSender email.EmailSender,
	emailTokenRepo email.EmailTokenRepository,
) *emailServiceImpl {
	return &emailServiceImpl{
		userService:    userService,
		emailSender:    emailSender,
		emailTokenRepo: emailTokenRepo,
	}
}
