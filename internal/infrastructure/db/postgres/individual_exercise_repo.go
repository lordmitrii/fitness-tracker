package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

// IndividualExerciseRepo implements workout.Repository using PostgreSQL.
type IndividualExerciseRepo struct {
	db *gorm.DB
}

func NewIndividualExerciseRepo(db *gorm.DB) workout.IndividualExerciseRepository {
	return &IndividualExerciseRepo{db: db}
}

func (r *IndividualExerciseRepo) Create(ctx context.Context, pe *workout.IndividualExercise) error {
	return r.db.WithContext(ctx).Create(pe).Error
}

func (r *IndividualExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").First(&pe, id).Error; err != nil {
		return nil, err
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) GetByUserID(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error) {
	var exercises []*workout.IndividualExercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").Where("user_id = ?", userID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *IndividualExerciseRepo) GetByUserAndExerciseID(ctx context.Context, userID, exerciseID uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").Where("user_id = ? AND exercise_id = ?", userID, exerciseID).First(&pe).Error; err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) GetByNameMuscleGroupAndUser(ctx context.Context, name string, muscleGroupID *uint, userID uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.db.WithContext(ctx).Preload("MuscleGroup").Where("name = ? AND muscle_group_id = ? AND user_id = ?", name, muscleGroupID, userID).First(&pe).Error; err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) Update(ctx context.Context, pe *workout.IndividualExercise) error {
	res := r.db.WithContext(ctx).Model(&workout.IndividualExercise{}).Where("id = ?", pe.ID).Updates(pe)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *IndividualExerciseRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.IndividualExercise{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}