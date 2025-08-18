package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

type WorkoutSetRepo struct {
	db *gorm.DB
}

func NewWorkoutSetRepo(db *gorm.DB) workout.WorkoutSetRepository {
	return &WorkoutSetRepo{db: db}
}

func (r *WorkoutSetRepo) Create(ctx context.Context, ws *workout.WorkoutSet) error {
	return r.db.WithContext(ctx).Create(ws).Error
}

func (r *WorkoutSetRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutSet, error) {
	var ws workout.WorkoutSet
	if err := r.db.WithContext(ctx).First(&ws, id).Error; err != nil {
		return nil, err
	}
	return &ws, nil
}
func (r *WorkoutSetRepo) GetByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*workout.WorkoutSet, error) {
	var sets []*workout.WorkoutSet
	if err := r.db.WithContext(ctx).Where("workout_exercise_id = ?", workoutExerciseID).Order("index").Find(&sets).Error; err != nil {
		return nil, err
	}
	return sets, nil
}

func (r *WorkoutSetRepo) Update(ctx context.Context, ws *workout.WorkoutSet) error {
	updates := map[string]any{
		"weight":    ws.Weight,
		"reps":      ws.Reps,
		"completed": ws.Completed,
		"skipped":   ws.Skipped,
	}

	res := r.db.WithContext(ctx).Model(&workout.WorkoutSet{}).Where("id = ?", ws.ID).Updates(updates)

	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) Complete(ctx context.Context, ws *workout.WorkoutSet) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutSet{}).Where("id = ?", ws.ID).Select("completed", "skipped").Updates(ws).Error
}

func (r *WorkoutSetRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.WorkoutSet{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND completed = false", workoutExerciseID).
		Count(&count).Error

	return count, err
}

func (r *WorkoutSetRepo) GetMaxIndexByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) (int, error) {
	var maxIndex int
	err := r.db.WithContext(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ?", workoutExerciseID).
		Select("COALESCE(MAX(index), 0)").
		Scan(&maxIndex).Error

	if err != nil {
		return 0, err
	}
	return maxIndex, nil
}

func (r *WorkoutSetRepo) DecrementIndexesAfter(ctx context.Context, workoutExerciseID uint, deletedIndex int) error {
	return r.db.WithContext(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index > ?", workoutExerciseID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}

func (r *WorkoutSetRepo) IncrementIndexesAfter(ctx context.Context, workoutExerciseID uint, index int) error {
	return r.db.WithContext(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index >= ?", workoutExerciseID, index).
		Update("index", gorm.Expr("index + 1")).
		Error
}

func (r *WorkoutSetRepo) SwapWorkoutSetsByIndex(ctx context.Context, workoutExerciseID uint, index1, index2 int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var set1, set2 workout.WorkoutSet

		if err := tx.Where("workout_exercise_id = ? AND index = ?", workoutExerciseID, index1).First(&set1).Error; err != nil {
			return err
		}
		if err := tx.Where("workout_exercise_id = ? AND index = ?", workoutExerciseID, index2).First(&set2).Error; err != nil {
			return err
		}

		set1.Index, set2.Index = set2.Index, set1.Index

		if err := tx.Save(&set1).Error; err != nil {
			return err
		}
		if err := tx.Save(&set2).Error; err != nil {
			return err
		}

		return nil
	})
}
