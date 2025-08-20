package user

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
)

func (s *userServiceImpl) CreateProfile(ctx context.Context, p *user.Profile) error {
	return s.profileRepo.Create(ctx, p)
}

func (s *userServiceImpl) GetProfile(ctx context.Context, userID uint) (*user.Profile, error) {
	return s.profileRepo.GetByUserID(ctx, userID)
}

func (s *userServiceImpl) UpdateProfile(ctx context.Context, p *user.Profile) error {
	return s.profileRepo.Update(ctx, p)
}

func (s *userServiceImpl) DeleteProfile(ctx context.Context, id uint) error {
	return s.profileRepo.Delete(ctx, id)
}
