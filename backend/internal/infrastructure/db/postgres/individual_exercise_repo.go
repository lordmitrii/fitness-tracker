package postgres

import (
	"context"
	"errors"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

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

func (r *IndividualExerciseRepo) Create(ctx context.Context, userId uint, ie *workout.IndividualExercise) error {
	db := r.dbFrom(ctx)
	ie.UserID = userId
	return db.Create(ie).Error
}

func (r *IndividualExerciseRepo) GetByID(ctx context.Context, userId, id uint) (*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var ie workout.IndividualExercise
	err := db.Model(&workout.IndividualExercise{}).
		Where("id = ? AND user_id = ?", id, userId).
		Preload("MuscleGroup").
		Preload("Exercise").
		First(&ie).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrIndividualExerciseNotFound
		}
		return nil, err
	}
	return &ie, nil
}

func (r *IndividualExerciseRepo) GetByUserID(ctx context.Context, userId uint) ([]*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var list []*workout.IndividualExercise
	if err := db.
		Where("user_id = ?", userId).
		Preload("MuscleGroup").
		Preload("Exercise").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *IndividualExerciseRepo) GetByUserAndExerciseID(ctx context.Context, userId, exerciseId uint) (*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var ie workout.IndividualExercise
	err := db.
		Where("user_id = ? AND exercise_id = ?", userId, exerciseId).
		Preload("MuscleGroup").
		Preload("Exercise").
		First(&ie).Error
	if err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &ie, nil
}

func (r *IndividualExerciseRepo) GetByNameMuscleGroupAndUser(ctx context.Context, userId uint, name string, muscleGroupID *uint) (*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var ie workout.IndividualExercise
	q := db.Where("name = ? AND user_id = ?", name, userId)
	if muscleGroupID != nil {
		q = q.Where("muscle_group_id = ?", *muscleGroupID)
	}
	err := q.Preload("MuscleGroup").
		Preload("Exercise").
		First(&ie).Error
	if err != nil {
		return nil, custom_err.ErrIndividualExerciseNotFound
	}
	return &ie, nil
}

func (r *IndividualExerciseRepo) Update(ctx context.Context, userId, id uint, updates map[string]any) error {
	db := r.dbFrom(ctx)

	res := db.Model(&workout.IndividualExercise{}).
		Where("id = ? AND user_id = ?", id, userId).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *IndividualExerciseRepo) UpdateReturning(ctx context.Context, userId, id uint, updates map[string]any) (*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var ie workout.IndividualExercise
	res := db.Model(&ie).
		Where("id = ? AND user_id = ?", id, userId).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}
	return &ie, nil
}

func (r *IndividualExerciseRepo) GetByIDForUpdate(ctx context.Context, userId, id uint) (*workout.IndividualExercise, error) {
	db := r.dbFrom(ctx)

	var ie workout.IndividualExercise
	err := db.Model(&workout.IndividualExercise{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("id = ? AND user_id = ?", id, userId).
		First(&ie).Error
	if err != nil {
		return nil, err
	}
	return &ie, nil
}

func (r *IndividualExerciseRepo) Delete(ctx context.Context, userId, id uint) error {
	db := r.dbFrom(ctx)

	res := db.Where("id = ? AND user_id = ?", id, userId).
		Delete(&workout.IndividualExercise{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
