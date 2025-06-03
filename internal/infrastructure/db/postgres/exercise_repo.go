package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
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
	if err := r.db.WithContext(ctx).First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExerciseRepo) GetByMuscleGroup(ctx context.Context, muscleGroup string) ([]*workout.Exercise, error) {
	var exercises []*workout.Exercise
	if err := r.db.WithContext(ctx).Where("muscle_group = ?", muscleGroup).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) GetAll(ctx context.Context) ([]*workout.Exercise, error) {
	var exercises []*workout.Exercise
	if err := r.db.WithContext(ctx).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) Update(ctx context.Context, e *workout.Exercise) error {
	res := r.db.WithContext(ctx).Model(&workout.Exercise{}).Where("id = ?", e.ID).Updates(e)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *ExerciseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.Exercise{}, id).Error
}
