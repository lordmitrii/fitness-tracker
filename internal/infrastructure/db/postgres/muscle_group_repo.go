package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

type MuscleGroupRepo struct {
	db *gorm.DB
}

func NewMuscleGroupRepo(db *gorm.DB) workout.MuscleGroupRepository {
	return &MuscleGroupRepo{db: db}
}

func (r *MuscleGroupRepo) Create(ctx context.Context, mg *workout.MuscleGroup) error {
	return r.db.WithContext(ctx).Create(mg).Error
}

func (r *MuscleGroupRepo) GetByID(ctx context.Context, id uint) (*workout.MuscleGroup, error) {
	var mg workout.MuscleGroup
	if err := r.db.WithContext(ctx).First(&mg, id).Error; err != nil {
		return nil, err
	}
	return &mg, nil
}

func (r *MuscleGroupRepo) GetByName(ctx context.Context, name string) (*workout.MuscleGroup, error) {
	var mg workout.MuscleGroup
	if err := r.db.WithContext(ctx).Where("name = ?", name).First(&mg).Error; err != nil {
		return nil, err
	}
	return &mg, nil
}

func (r *MuscleGroupRepo) GetAll(ctx context.Context) ([]*workout.MuscleGroup, error) {
	var muscleGroups []*workout.MuscleGroup
	if err := r.db.WithContext(ctx).Find(&muscleGroups).Error; err != nil {
		return nil, err
	}
	return muscleGroups, nil
}

func (r *MuscleGroupRepo) Update(ctx context.Context, mg *workout.MuscleGroup) error {
	res := r.db.WithContext(ctx).Model(&workout.MuscleGroup{}).Where("id = ?", mg.ID).Updates(mg)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *MuscleGroupRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.MuscleGroup{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
