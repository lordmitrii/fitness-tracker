package user

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

func (s *userServiceImpl) GetConsents(ctx context.Context, userID uint) ([]*user.UserConsent, error) {
	return s.userConsentRepo.GetByUserID(ctx, userID)
}

func (s *userServiceImpl) CreateConsent(ctx context.Context, consent *user.UserConsent) error {
	return s.userConsentRepo.Create(ctx, consent)
}

func (s *userServiceImpl) UpdateConsent(ctx context.Context, id uint, updates map[string]any) (*user.UserConsent, error) {
	return s.userConsentRepo.UpdateReturning(ctx, id, updates)
}

func (s *userServiceImpl) DeleteConsent(ctx context.Context, userID uint, consentType, version string) error {
	return s.userConsentRepo.DeleteByUserIDAndType(ctx, userID, consentType, version)
}
