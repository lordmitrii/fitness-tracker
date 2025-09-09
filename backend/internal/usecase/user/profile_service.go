package user

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

func (s *userServiceImpl) CreateProfile(ctx context.Context, p *user.Profile) error {
	return s.profileRepo.Create(ctx, p)
}

func (s *userServiceImpl) GetProfile(ctx context.Context, userID uint) (*user.Profile, error) {
	p, err := s.profileRepo.GetByUserID(ctx, userID)
	if err != nil && err == custom_err.ErrProfileNotFound {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return p, nil
}

func (s *userServiceImpl) UpdateProfile(ctx context.Context, id uint, updates map[string]any) (*user.Profile, error) {
	return s.profileRepo.UpdateReturning(ctx, id, updates)
}

func (s *userServiceImpl) DeleteProfile(ctx context.Context, id uint) error {
	return s.profileRepo.Delete(ctx, id)
}
