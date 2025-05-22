package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

type WorkoutExerciseRepo struct {
	db *gorm.DB
}

func NewWorkoutExerciseRepo(db *gorm.DB) workout.WorkoutExerciseRepository {
	return &WorkoutExerciseRepo{db: db}
}

func (r *WorkoutExerciseRepo) Create(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.db.WithContext(ctx).Create(e).Error
}
func (r *WorkoutExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	var e workout.WorkoutExercise
	if err := r.db.WithContext(ctx).Preload("Exercise").First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *WorkoutExerciseRepo) GetByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.db.WithContext(ctx).Preload("Exercise").Where("workout_id = ?", workoutID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) Update(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *WorkoutExerciseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.WorkoutExercise{}, id).Error
}
