package postgres

import (
	"context"
	"gorm.io/gorm"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
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

func (r *ExerciseRepo) GetByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.Exercise, error) {
	var exercises []*workout.Exercise
	if err := r.db.WithContext(ctx).Where("workout_id = ?", workoutID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) Update(ctx context.Context, e *workout.Exercise) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *ExerciseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.Exercise{}, id).Error
}