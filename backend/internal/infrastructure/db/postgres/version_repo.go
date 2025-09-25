package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"gorm.io/gorm"
)

const DEFAULT_VERSION = "1.0.0"

type versionRepository struct {
	db *gorm.DB
}

func NewVersionRepository(db *gorm.DB) versions.VersionRepository {
	return &versionRepository{
		db: db,
	}
}

func (r *versionRepository) Create(ctx context.Context, version *versions.Version) error {
	return r.db.Create(version).Error
}

func (r *versionRepository) GetByID(ctx context.Context, id uint) (*versions.Version, error) {
	var version versions.Version
	if err := r.db.First(&version, id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *versionRepository) GetByKey(ctx context.Context, key string) (*versions.Version, error) {
	var version versions.Version
	if err := r.db.Where("key = ?", key).First(&version).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *versionRepository) GetAll(ctx context.Context) ([]*versions.Version, error) {
	var versionsList []*versions.Version
	if err := r.db.Find(&versionsList).Error; err != nil {
		return nil, err
	}
	return versionsList, nil
}

func (r *versionRepository) Update(ctx context.Context, version *versions.Version) error {
	return r.db.Save(version).Error
}

func (r *versionRepository) Delete(ctx context.Context, id uint) error {
	return r.db.Delete(&versions.Version{}, id).Error
}

func (r *versionRepository) BumpVersion(ctx context.Context, key string) error {
	var v versions.Version
	if err := r.db.Where("key = ?", key).First(&v).Error; err != nil {
		return r.db.Create(&versions.Version{Key: key, Version: DEFAULT_VERSION}).Error
	}
	v.Increment()
	return r.db.Save(&v).Error
}
