package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WorkoutSetRepo struct {
	db *gorm.DB
}

func NewWorkoutSetRepo(db *gorm.DB) workout.WorkoutSetRepository {
	return &WorkoutSetRepo{db: db}
}

func (r *WorkoutSetRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *WorkoutSetRepo) Create(ctx context.Context, ws *workout.WorkoutSet) error {
	return r.dbFrom(ctx).Create(ws).Error
}

func (r *WorkoutSetRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutSet, error) {
	var ws workout.WorkoutSet
	if err := r.dbFrom(ctx).First(&ws, id).Error; err != nil {
		return nil, err
	}
	return &ws, nil
}
func (r *WorkoutSetRepo) GetByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*workout.WorkoutSet, error) {
	var sets []*workout.WorkoutSet
	if err := r.dbFrom(ctx).Where("workout_exercise_id = ?", workoutExerciseID).Order("index").Find(&sets).Error; err != nil {
		return nil, err
	}
	return sets, nil
}

func (r *WorkoutSetRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).Model(&workout.WorkoutSet{}).Where("id = ?", id).Updates(updates)

	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutSet, error) {
	var ws workout.WorkoutSet
	res := r.dbFrom(ctx).
		Model(&ws).Where("id = ?", id).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}
	return &ws, nil
}

func (r *WorkoutSetRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).Delete(&workout.WorkoutSet{}, id)
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
	err := r.dbFrom(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND completed = false", workoutExerciseID).
		Count(&count).Error

	return count, err
}

func (r *WorkoutSetRepo) GetMaxIndexByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) (int, error) {
	var maxIndex int
	err := r.dbFrom(ctx).
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
	return r.dbFrom(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index > ?", workoutExerciseID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}

func (r *WorkoutSetRepo) IncrementIndexesAfter(ctx context.Context, workoutExerciseID uint, index int) error {
	return r.dbFrom(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index >= ?", workoutExerciseID, index).
		Update("index", gorm.Expr("index + 1")).
		Error
}

func (r *WorkoutSetRepo) SwapWorkoutSetsByIndex(ctx context.Context, workoutExerciseID uint, index1, index2 int) error {
	if index1 == index2 {
        return nil
    }

	db := r.dbFrom(ctx)
	var sets []workout.WorkoutSet
    if err := db.
        Where("workout_exercise_id = ? AND index IN (?, ?)", workoutExerciseID, index1, index2).
        Order("id ASC").
        Clauses(clause.Locking{Strength: "UPDATE"}).
        Find(&sets).Error; err != nil {
        return err
    }
    if len(sets) != 2 {
        return custom_err.ErrNotFound
    }

    idA, idxA := sets[0].ID, sets[0].Index
    idB, idxB := sets[1].ID, sets[1].Index

    return db.Model(&workout.WorkoutSet{}).
        Where("id IN (?, ?)", idA, idB).
        Updates(map[string]any{
            "index": gorm.Expr("CASE WHEN id = ? THEN ? WHEN id = ? THEN ? ELSE index END", idA, idxB, idB, idxA),
        }).Error
}

func (r *WorkoutSetRepo) GetSkippedSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error) {
	var count int64
	err := r.dbFrom(ctx).
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND skipped = true", workoutExerciseID).
		Count(&count).Error

	return count, err
}

func (r *WorkoutSetRepo) GetByIDForUpdate(ctx context.Context, id uint) (*workout.WorkoutSet, error) {
	var ws workout.WorkoutSet
	if err := r.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&ws, id).Error; err != nil {
		return nil, err
	}
	return &ws, nil
}