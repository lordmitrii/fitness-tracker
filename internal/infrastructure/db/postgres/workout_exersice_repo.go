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

func (r *ExerciseRepo) Create(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.db.WithContext(ctx).Create(e).Error
}
func (r *ExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	var e workout.WorkoutExercise
	if err := r.db.WithContext(ctx).First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExerciseRepo) GetByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.db.WithContext(ctx).Where("workout_id = ?", workoutID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepo) Update(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *ExerciseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.WorkoutExercise{}, id).Error
}
