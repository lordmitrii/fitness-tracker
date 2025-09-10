package email

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

type emailServiceImpl struct {
	userRepo       user.UserRepository
	roleRepo       rbac.RoleRepository
	emailSender    email.EmailSender
	emailTokenRepo email.EmailTokenRepository
}

func NewEmailService(
	userRepo user.UserRepository,
	roleRepo rbac.RoleRepository,
	emailSender email.EmailSender,
	emailTokenRepo email.EmailTokenRepository,
) *emailServiceImpl {
	return &emailServiceImpl{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		emailSender:    emailSender,
		emailTokenRepo: emailTokenRepo,
	}
}
