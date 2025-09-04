package user

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

func (s *userServiceImpl) CreateUserSettings(ctx context.Context, us *user.UserSettings) error {
	return s.settingsRepo.Create(ctx, us)
}

func (s *userServiceImpl) GetUserSettings(ctx context.Context, userID uint) (*user.UserSettings, error) {
	// Allow creation of default settings if not found
	settings, err := s.settingsRepo.GetByUserID(ctx, userID)
	if err == custom_err.ErrNotFound {
		settings = &user.UserSettings{UserID: userID}
		err := s.settingsRepo.Create(ctx, settings)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *userServiceImpl) UpdateUserSettings(ctx context.Context, userID uint, updates map[string]any) error {
	return s.settingsRepo.Update(ctx, userID, updates)
}

func (s *userServiceImpl) DeleteUserSettings(ctx context.Context, userID uint) error {
	return s.settingsRepo.Delete(ctx, userID)
}
