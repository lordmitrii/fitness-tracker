package postgres

import (
	"context"
	"errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

// WorkoutRepo implements workout.Repository using PostgreSQL.
type WorkoutRepo struct {
	db *gorm.DB
}

func NewWorkoutRepo(db *gorm.DB) workout.WorkoutRepository {
	return &WorkoutRepo{db: db}
}

func (r *WorkoutRepo) Create(ctx context.Context, w *workout.Workout) error {
	return r.db.WithContext(ctx).Create(w).Error
}

func (r *WorkoutRepo) BulkCreate(ctx context.Context, workouts []*workout.Workout) error {
	return r.db.WithContext(ctx).Create(&workouts).Error
}

func (r *WorkoutRepo) GetByID(ctx context.Context, id uint) (*workout.Workout, error) {
	var w workout.Workout
	if err := r.db.WithContext(ctx).
		Preload("WorkoutExercises").
		Preload("WorkoutExercises.Exercise").
		First(&w, id).
		Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &w, nil
}

func (r *WorkoutRepo) GetByWorkoutCycleID(ctx context.Context, workoutCycleID uint) ([]*workout.Workout, error) {
	var workouts []*workout.Workout
	if err := r.db.WithContext(ctx).
		Where("workout_cycle_id = ?", workoutCycleID).
		Find(&workouts).
		Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return workouts, nil
}

func (r *WorkoutRepo) Update(ctx context.Context, w *workout.Workout) error {
	res := r.db.WithContext(ctx).
		Model(&workout.Workout{}).
		Where("id = ?", w.ID).
		Updates(w)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *WorkoutRepo) Complete(ctx context.Context, w *workout.Workout) error {
	return r.db.WithContext(ctx).Model(&workout.Workout{}).Where("id = ?", w.ID).Select("completed").Updates(w).Error
}

func (r *WorkoutRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).
		Delete(&workout.Workout{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *WorkoutRepo) GetIncompleteExercisesCount(ctx context.Context, id uint) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND completed = ?", id, false).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}
