package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
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
	if err := r.db.WithContext(ctx).Preload("WorkoutSets").Preload("IndividualExercise").First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *WorkoutExerciseRepo) GetByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.db.WithContext(ctx).Preload("IndividualExercise").Preload("WorkoutSets").Where("workout_id = ?", workoutID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) Update(ctx context.Context, e *workout.WorkoutExercise) error {
	res := r.db.WithContext(ctx).Model(&workout.WorkoutExercise{}).Where("id = ?", e.ID).Updates(e)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutExerciseRepo) Complete(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutExercise{}).Where("id = ?", e.ID).Select("completed").Updates(e).Error
}

func (r *WorkoutExerciseRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.WorkoutExercise{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutExerciseRepo) GetIncompleteExercisesCount(ctx context.Context, workoutId uint) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND completed = ?", workoutId, false).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutExerciseRepo) GetRelatedIndividualExercise(ctx context.Context, id uint) (*workout.IndividualExercise, error) {
	var we workout.WorkoutExercise
	if err := r.db.WithContext(ctx).
		Preload("IndividualExercise").
		First(&we, id).Error; err != nil {
		return nil, err
	}
	return we.IndividualExercise, nil
}

func (r *WorkoutExerciseRepo) GetLast5ByIndividualExerciseID(ctx context.Context, individualExerciseID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.db.WithContext(ctx).
		Where("individual_exercise_id = ?", individualExerciseID).
		Order("individual_exercise_id, created_at DESC").
		Preload("WorkoutSets").Limit(5).
		Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) GetMaxIndexByWorkoutID(ctx context.Context, workoutID uint) (int, error) {
	var maxIndex int
	err := r.db.WithContext(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ?", workoutID).
		Select("COALESCE(MAX(index), 0)").
		Scan(&maxIndex).Error

	return maxIndex, err
}

func (r *WorkoutExerciseRepo) DecrementIndexesAfter(ctx context.Context, workoutID uint, deletedIndex int) error {
	return r.db.WithContext(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND index > ?", workoutID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}