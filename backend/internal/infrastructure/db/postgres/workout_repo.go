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

type WorkoutRepo struct {
	db *gorm.DB
}

func NewWorkoutRepo(db *gorm.DB) workout.WorkoutRepository {
	return &WorkoutRepo{db: db}
}

func (r *WorkoutRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *WorkoutRepo) Create(ctx context.Context, w *workout.Workout) error {
	return r.dbFrom(ctx).Create(w).Error
}

func (r *WorkoutRepo) BulkCreate(ctx context.Context, workouts []*workout.Workout) error {
	return r.dbFrom(ctx).Create(&workouts).Error
}

func (r *WorkoutRepo) GetByID(ctx context.Context, id uint) (*workout.Workout, error) {
	var w workout.Workout
	if err := r.dbFrom(ctx).
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
	if err := r.dbFrom(ctx).
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

func (r *WorkoutRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).
		Model(&workout.Workout{}).
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

func (r *WorkoutRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.Workout, error) {
	var w workout.Workout
	tx := r.dbFrom(ctx)

	res := tx.Model(&w).
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
		Model(&workout.WorkoutExercise{}).
		Where("workout_id = ?", id).
		Order("index ASC").
		Find(&w.WorkoutExercises).Error; err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkoutRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).
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
	if err := r.dbFrom(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND completed = false", workoutCycleID).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutRepo) GetMaxWorkoutIndexByWorkoutCycleID(ctx context.Context, cycleID uint) (int, error) {
	var max int
	err := r.dbFrom(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ?", cycleID).
		Select("COALESCE(MAX(index), 0)").
		Scan(&max).Error
	return max, err
}

func (r *WorkoutRepo) DecrementIndexesAfterWorkout(ctx context.Context, workoutCycleID uint, deletedIndex int) error {
	return r.dbFrom(ctx).
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND index > ?", workoutCycleID, deletedIndex).
		Update("index", gorm.Expr("index - 1")).
		Error
}

func (r *WorkoutRepo) SwapWorkoutsByIndex(ctx context.Context, workoutCycleID uint, index1, index2 int) error {
	if index1 == index2 {
		return nil
	}
	db := r.dbFrom(ctx)
	var workouts []workout.Workout
	if err := db.Where("workout_cycle_id = ? AND index IN (?, ?)", workoutCycleID, index1, index2).
		Order("id ASC").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Find(&workouts).Error; err != nil {
		return err
	}
	if len(workouts) != 2 {
		return custom_err.ErrNotFound
	}

	idA, idxA := workouts[0].ID, workouts[0].Index
	idB, idxB := workouts[1].ID, workouts[1].Index

	return db.Model(&workout.Workout{}).
		Where("id IN (?, ?)", idA, idB).
		Updates(map[string]any{
			"index": gorm.Expr("CASE WHEN id = ? THEN ? WHEN id = ? THEN ? ELSE index END", idA, idxB, idB, idxA),
		}).Error
}

func (r *WorkoutRepo) GetSkippedWorkoutsCount(ctx context.Context, workoutCycleID uint) (int64, error) {
	var count int64
	if err := r.dbFrom(ctx).Model(&workout.Workout{}).
		Where("workout_cycle_id = ? AND skipped = true", workoutCycleID).
		Count(&count).
		Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutRepo) LockByIDForUpdate(ctx context.Context, id uint) error {
	var w workout.Workout
	return r.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&w, id).Error
}

func (r *WorkoutRepo) GetByIDForUpdate(ctx context.Context, id uint) (*workout.Workout, error) {
	var w workout.Workout
	if err := r.dbFrom(ctx).
		Preload("WorkoutExercises.IndividualExercise").
		Preload("WorkoutExercises.WorkoutSets").
		Clauses(clause.Locking{Strength: "UPDATE"}).First(&w, id).Error; err != nil {
		return nil, err
	}
	return &w, nil
}
