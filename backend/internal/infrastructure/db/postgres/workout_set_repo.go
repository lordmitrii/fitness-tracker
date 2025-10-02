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

func (r *WorkoutSetRepo) GetOnlyByWorkoutExerciseID(ctx context.Context, userId, workoutExerciseID uint) ([]*workout.WorkoutSet, error) {
	db := r.dbFrom(ctx)

	weID := workoutExerciseID
	chain := SubqWorkoutExercises(db, userId, 0, 0, 0, &weID).Select("1")

	var sets []*workout.WorkoutSet
	err := db.Model(&workout.WorkoutSet{}).
		Where("workout_sets.workout_exercise_id = ? AND EXISTS (?)", workoutExerciseID, chain).
		Order("workout_sets.index ASC").
		Find(&sets).Error
	if err != nil {
		return nil, err
	}
	return sets, nil
}

func (r *WorkoutSetRepo) GetByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) ([]*workout.WorkoutSet, error) {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var sets []*workout.WorkoutSet
	err := db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND EXISTS (?)", weId, chain).
		Order("index ASC").
		Find(&sets).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return sets, nil
}


func (r *WorkoutSetRepo) Create(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, ws *workout.WorkoutSet) error {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var ok bool
	if err := db.
		Raw("SELECT EXISTS (?)", chain).
		Scan(&ok).Error; err != nil {
		return err
	}
	if !ok {
		return custom_err.ErrNotFound
	}

	ws.WorkoutExerciseID = weId
	return db.Create(ws).Error
}

func (r *WorkoutSetRepo) GetByID(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) (*workout.WorkoutSet, error) {
	db := r.dbFrom(ctx)

	setID := id
	chain := SubqWorkoutSets(db, userId, planId, cycleId, workoutId, weId, &setID).Select("1")

	var ws workout.WorkoutSet
	err := db.Model(&workout.WorkoutSet{}).
		Where("workout_sets.id = ? AND EXISTS (?)", id, chain).
		First(&ws).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &ws, nil
}


func (r *WorkoutSetRepo) Update(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) error {
	db := r.dbFrom(ctx)

	setID := id
	chain := SubqWorkoutSets(db, userId, planId, cycleId, workoutId, weId, &setID).Select("1")

	res := db.Model(&workout.WorkoutSet{}).
		Where("id = ? AND EXISTS (?)", id, chain).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) UpdateReturning(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) (*workout.WorkoutSet, error) {
	db := r.dbFrom(ctx)

	setID := id
	chain := SubqWorkoutSets(db, userId, planId, cycleId, workoutId, weId, &setID).Select("1")

	var ws workout.WorkoutSet
	res := db.Model(&ws).
		Where("id = ? AND EXISTS (?)", id, chain).
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

func (r *WorkoutSetRepo) Delete(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) error {
	db := r.dbFrom(ctx)

	setID := id
	chain := SubqWorkoutSets(db, userId, planId, cycleId, workoutId, weId, &setID).Select("1")

	res := db.Where("id = ? AND EXISTS (?)", id, chain).Delete(&workout.WorkoutSet{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutSetRepo) GetIncompleteSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error) {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var count int64
	err := db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND completed = FALSE AND EXISTS (?)", weId, chain).
		Count(&count).Error
	return count, err
}

func (r *WorkoutSetRepo) GetSkippedSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error) {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var count int64
	err := db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND skipped = TRUE AND EXISTS (?)", weId, chain).
		Count(&count).Error
	return count, err
}

func (r *WorkoutSetRepo) GetMaxIndexByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int, error) {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var max int
	err := db.Model(&workout.WorkoutSet{}).
		Select("COALESCE(MAX(index), 0)").
		Where("workout_exercise_id = ? AND EXISTS (?)", weId, chain).
		Scan(&max).Error
	return max, err
}

func (r *WorkoutSetRepo) DecrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, deletedIndex int) error {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	return db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index > ? AND EXISTS (?)", weId, deletedIndex, chain).
		Update("index", gorm.Expr("index - 1")).Error
}

func (r *WorkoutSetRepo) IncrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, index int) error {
	db := r.dbFrom(ctx)

	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	return db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ? AND index >= ? AND EXISTS (?)", weId, index, chain).
		Update("index", gorm.Expr("index + 1")).Error
}

func (r *WorkoutSetRepo) SwapWorkoutSetsByIndex(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, index1, index2 int) error {
	if index1 == index2 {
		return nil
	}

	db := r.dbFrom(ctx)
	chain := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weId).Select("1")

	var sets []workout.WorkoutSet
	if err := db.
		Where("workout_exercise_id = ? AND index IN (?, ?) AND EXISTS (?)", weId, index1, index2, chain).
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

func (r *WorkoutSetRepo) GetByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, id uint) (*workout.WorkoutSet, error) {
	db := r.dbFrom(ctx)

	setID := id
	chain := SubqWorkoutSets(db, userId, planId, cycleId, workoutId, weId, &setID).Select("1")

	var ws workout.WorkoutSet
	err := db.Model(&workout.WorkoutSet{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workout_sets.id = ? AND EXISTS (?)", id, chain).
		First(&ws).Error
	if err != nil {
		return nil, err
	}
	return &ws, nil
}
