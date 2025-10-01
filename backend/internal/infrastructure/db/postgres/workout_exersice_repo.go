package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WorkoutExerciseRepo struct {
	db *gorm.DB
}

func NewWorkoutExerciseRepo(db *gorm.DB) workout.WorkoutExerciseRepository {
	return &WorkoutExerciseRepo{db: db}
}

func (r *WorkoutExerciseRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *WorkoutExerciseRepo) Create(ctx context.Context, e *workout.WorkoutExercise) error {
	return r.dbFrom(ctx).Create(e).Error
}
func (r *WorkoutExerciseRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	var e workout.WorkoutExercise
	if err := r.dbFrom(ctx).Preload("WorkoutSets").Preload("IndividualExercise.MuscleGroup").First(&e, id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *WorkoutExerciseRepo) GetByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.dbFrom(ctx).Preload("IndividualExercise.MuscleGroup").Preload("WorkoutSets").Where("workout_id = ?", workoutID).Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("id = ?", id).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutExerciseRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutExercise, error) {
	var we workout.WorkoutExercise
	tx := r.dbFrom(ctx)

	res := tx.Model(&we).
		Where("id = ?", id).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}

	if err := tx.
		Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ?", id).
		Order("index ASC").
		Find(&we.WorkoutSets).Error; err != nil {
		return nil, err
	}

	if we.IndividualExerciseID != 0 {
		var ie workout.IndividualExercise
		if err := tx.
			// Preload("MuscleGroup").
			// Preload("Exercise").
			First(&ie, we.IndividualExerciseID).Error; err != nil {
			return nil, err
		}
		we.IndividualExercise = &ie
	} else {
		we.IndividualExercise = nil
	}

	return &we, nil
}

func (r *WorkoutExerciseRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).Delete(&workout.WorkoutExercise{}, id)
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
	if err := r.dbFrom(ctx).Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND completed = false", workoutId).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutExerciseRepo) GetRelatedIndividualExercise(ctx context.Context, id uint) (*workout.IndividualExercise, error) {
	var we workout.WorkoutExercise
	if err := r.dbFrom(ctx).
		Preload("IndividualExercise.MuscleGroup").
		First(&we, id).Error; err != nil {
		return nil, err
	}
	return we.IndividualExercise, nil
}

func (r *WorkoutExerciseRepo) GetLast5ByIndividualExerciseID(ctx context.Context, individualExerciseID uint) ([]*workout.WorkoutExercise, error) {
	var exercises []*workout.WorkoutExercise
	if err := r.dbFrom(ctx).
		Where("individual_exercise_id = ?", individualExerciseID).
		Joins("JOIN workout_sets ON workout_sets.workout_exercise_id = workout_exercises.id").
		Where("workout_sets.reps IS NOT NULL AND workout_sets.weight IS NOT NULL").
		Order("workout_exercises.created_at DESC").
		Preload("WorkoutSets").
		Limit(5).
		Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) GetMaxIndexByWorkoutID(ctx context.Context, workoutID uint) (int, error) {
	var maxIndex int
	err := r.dbFrom(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ?", workoutID).
		Select("COALESCE(MAX(index), 0)").
		Scan(&maxIndex).Error

	return maxIndex, err
}

func (r *WorkoutExerciseRepo) DecrementIndexesAfter(ctx context.Context, workoutID uint, deletedIndex int) error {
	return r.dbFrom(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND index > ?", workoutID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}

func (r *WorkoutExerciseRepo) IncrementIndexesAfter(ctx context.Context, workoutID uint, index int) error {
	return r.dbFrom(ctx).
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND index >= ?", workoutID, index).
		Update("index", gorm.Expr("index + 1")).
		Error
}

func (r *WorkoutExerciseRepo) SwapWorkoutExercisesByIndex(ctx context.Context, workoutID uint, index1, index2 int) error {
	if index1 == index2 {
		return nil
	}
	db := r.dbFrom(ctx)
	var exercises []workout.WorkoutExercise
	if err := db.
		Where("workout_id = ? AND index IN (?, ?)", workoutID, index1, index2).
		Order("id ASC").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Find(&exercises).Error; err != nil {
		return err
	}
	if len(exercises) != 2 {
		return custom_err.ErrNotFound
	}

	idA, idxA := exercises[0].ID, exercises[0].Index
	idB, idxB := exercises[1].ID, exercises[1].Index

	return db.Model(&workout.WorkoutExercise{}).
		Where("id IN (?, ?)", idA, idB).
		Updates(map[string]any{
			"index": gorm.Expr("CASE WHEN id = ? THEN ? WHEN id = ? THEN ? ELSE index END", idA, idxB, idB, idxA),
		}).Error
	
}

func (r *WorkoutExerciseRepo) GetSkippedExercisesCount(ctx context.Context, workoutId uint) (int64, error) {
	var count int64
	if err := r.dbFrom(ctx).Model(&workout.WorkoutExercise{}).
		Where("workout_id = ? AND skipped = true", workoutId).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutExerciseRepo) LockByIDForUpdate(ctx context.Context, id uint) error {
	var we workout.WorkoutExercise
	return r.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&we, id).Error
}

func (r *WorkoutExerciseRepo) GetByIDForUpdate(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	var we workout.WorkoutExercise
	if err := r.dbFrom(ctx).Preload("WorkoutSets").Preload("IndividualExercise.MuscleGroup").Clauses(clause.Locking{Strength: "UPDATE"}).First(&we, id).Error; err != nil {
		return nil, err
	}
	return &we, nil
}
