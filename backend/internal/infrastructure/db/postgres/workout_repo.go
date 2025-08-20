package postgres

import (
	"context"
	"errors"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
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
		Preload("WorkoutExercises.IndividualExercise").
		Preload("WorkoutExercises.WorkoutSets").
		First(&w, id).
		Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
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
			return nil, custom_err.ErrNotFound
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
		return custom_err.ErrNotFound
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
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutRepo) GetIncompleteWorkoutsCount(ctx context.Context, workoutCycleID uint) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND completed = false", workoutCycleID).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutRepo) GetMaxWorkoutIndexByWorkoutCycleID(ctx context.Context, workoutCycleID uint) (int, error) {
	var max int
	err := r.db.WithContext(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ?", workoutCycleID).
		Select("COALESCE(MAX(index), 0)").
		Scan(&max).Error

	if err != nil {
		return 0, err
	}
	return max, nil
}

func (r *WorkoutRepo) DecrementIndexesAfterWorkout(ctx context.Context, workoutCycleID uint, deletedIndex int) error {
	return r.db.WithContext(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND index > ?", workoutCycleID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}

func (r *WorkoutRepo) SwapWorkoutsByIndex(ctx context.Context, workoutCycleID uint, index1, index2 int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var w1, w2 workout.Workout
		if err := tx.Where("workout_cycle_id = ? AND index = ?", workoutCycleID, index1).First(&w1).Error; err != nil {
			return err
		}
		if err := tx.Where("workout_cycle_id = ? AND index = ?", workoutCycleID, index2).First(&w2).Error; err != nil {
			return err
		}
		w1.Index, w2.Index = w2.Index, w1.Index
		if err := tx.Save(&w1).Error; err != nil {
			return err
		}
		if err := tx.Save(&w2).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *WorkoutRepo) GetSkippedWorkoutsCount(ctx context.Context, workoutCycleID uint) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND skipped = true", workoutCycleID).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}
