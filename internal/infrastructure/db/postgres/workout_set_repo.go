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
	if err := r.db.WithContext(ctx).Where("workout_exercise_id = ?", workoutExerciseID).Find(&sets).Error; err != nil {
		return nil, err
	}
	return sets, nil
}

func (r *WorkoutSetRepo) Update(ctx context.Context, ws *workout.WorkoutSet) error {
	res := r.db.WithContext(ctx).Model(&workout.WorkoutSet{}).Where("id = ?", ws.ID).Updates(ws)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) Complete(ctx context.Context, ws *workout.WorkoutSet) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutSet{}).Where("id = ?", ws.ID).Select("completed").Updates(ws).Error
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