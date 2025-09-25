package versions

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
)

func (s *versionsServiceImpl) GetCurrentVersion(ctx context.Context, key string) (*versions.Version, error) {
	return s.versionsRepo.GetByKey(ctx, key)
}

func (s *versionsServiceImpl) GetAllVersions(ctx context.Context) ([]*versions.Version, error) {
	return s.versionsRepo.GetAll(ctx)
}
