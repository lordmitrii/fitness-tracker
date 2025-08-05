package email

import (
	"context"
)

type EmailTokenRepository interface {
	Create(ctx context.Context, token *EmailToken) error
	GetByTokenAndType(ctx context.Context, token, tokenType string) (*EmailToken, error)
	DeleteExpiredTokens(ctx context.Context) error
	Delete(ctx context.Context, id uint) error
}
