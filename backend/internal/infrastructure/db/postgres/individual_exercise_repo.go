package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// IndividualExerciseRepo implements workout.Repository using PostgreSQL.
type IndividualExerciseRepo struct {
	db *gorm.DB
}

func NewIndividualExerciseRepo(db *gorm.DB) workout.IndividualExerciseRepository {
	return &IndividualExerciseRepo{db: db}
}

func (r *IndividualExerciseRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *IndividualExerciseRepo) Create(ctx context.Context, pe *workout.IndividualExercise) error {
	return r.dbFrom(ctx).Create(pe).Error
}

func (r *IndividualExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.dbFrom(ctx).Preload("MuscleGroup").First(&pe, id).Error; err != nil {
		return nil, err
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) GetByUserID(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error) {
	var exercises []*workout.IndividualExercise
	if err := r.dbFrom(ctx).Preload("MuscleGroup").Preload("Exercise").Where("user_id = ?", userID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *IndividualExerciseRepo) GetByUserAndExerciseID(ctx context.Context, userID, exerciseID uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.dbFrom(ctx).Preload("MuscleGroup").Preload("Exercise").Where("user_id = ? AND exercise_id = ?", userID, exerciseID).First(&pe).Error; err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) GetByNameMuscleGroupAndUser(ctx context.Context, name string, muscleGroupID *uint, userID uint) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	if err := r.dbFrom(ctx).Preload("MuscleGroup").Where("name = ? AND muscle_group_id = ? AND user_id = ?", name, muscleGroupID, userID).First(&pe).Error; err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).Model(&workout.IndividualExercise{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *IndividualExerciseRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.IndividualExercise, error) {
	var pe workout.IndividualExercise
	res := r.dbFrom(ctx).Model(&pe).Where("id = ?", id).Clauses(clause.Returning{}).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}
	return &pe, nil
}

func (r *IndividualExerciseRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).Delete(&workout.IndividualExercise{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
