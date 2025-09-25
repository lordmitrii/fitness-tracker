package versions

import (
	"context"
)

type VersionRepository interface {
	Create(ctx context.Context, version *Version) error
	GetByID(ctx context.Context, id uint) (*Version, error)
	GetByKey(ctx context.Context, key string) (*Version, error)
	GetAll(ctx context.Context) ([]*Version, error)
	Update(ctx context.Context, version *Version) error
	Delete(ctx context.Context, id uint) error
	BumpVersion(ctx context.Context, key string) error
}
