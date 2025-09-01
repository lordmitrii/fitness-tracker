package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ExerciseRepo struct {
	db *gorm.DB
}

func NewExerciseRepo(db *gorm.DB) workout.ExerciseRepository {
	return &ExerciseRepo{db: db}
}

func (r *ExerciseRepo) Create(ctx context.Context, e *workout.Exercise) error {
	return r.db.WithContext(ctx).Create(e).Error
}

func (r *ExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.Exercise, error) {
	var e workout.Exercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExerciseRepo) GetByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error) {
	var exercises []*workout.Exercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").Where("muscle_group_id = ?", muscleGroupID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) GetAll(ctx context.Context) ([]*workout.Exercise, error) {
	var exercises []*workout.Exercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.db.WithContext(ctx).Model(&workout.Exercise{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *ExerciseRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.Exercise, error) {
	var e workout.Exercise
	res := r.db.WithContext(ctx).Model(&e).Where("id = ?", id).Clauses(clause.Returning{}).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}
	return &e, nil
}

func (r *ExerciseRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.Exercise{}, id)

	if res.Error != nil {
		return res.Error
	}

	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}

	return nil
}
