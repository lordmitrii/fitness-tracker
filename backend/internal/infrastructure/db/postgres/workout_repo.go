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

func (r *WorkoutRepo) GetOnlyByID(ctx context.Context, userId, id uint) (*workout.Workout, error) {
	db := r.dbFrom(ctx)
	var w workout.Workout
	err := db.Model(&workout.Workout{}).
		Joins("JOIN workout_cycles wc ON wc.id = workouts.workout_cycle_id").
		Joins("JOIN workout_plans  wp ON wp.id = wc.workout_plan_id").
		Where("workouts.id = ? AND wp.user_id = ?", id, userId).
		Preload("WorkoutExercises.WorkoutSets").
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &w, nil
}

func (r *WorkoutRepo) Create(ctx context.Context, userId, planId, cycleId uint, w *workout.Workout) error {
	db := r.dbFrom(ctx)

	// Verify cycle belongs to user/plan
	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var cnt int64
	if err := db.Table("(?) AS wc", cSub).Count(&cnt).Error; err != nil {
		return err
	}
	if cnt == 0 {
		return custom_err.ErrNotFound
	}

	w.WorkoutCycleID = cycleId
	return db.Create(w).Error
}

func (r *WorkoutRepo) BulkCreate(ctx context.Context, userId, planId, cycleId uint, workouts []*workout.Workout) error {
	db := r.dbFrom(ctx)

	// Verify cycle belongs to user/plan
	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var cnt int64
	if err := db.Table("(?) AS wc", cSub).Count(&cnt).Error; err != nil {
		return err
	}
	if cnt == 0 {
		return custom_err.ErrNotFound
	}

	for _, it := range workouts {
		it.WorkoutCycleID = cycleId
	}
	return db.Create(&workouts).Error
}

func (r *WorkoutRepo) GetByID(ctx context.Context, userId, planId, cycleId, id uint) (*workout.Workout, error) {
	db := r.dbFrom(ctx)

	// Scope by exact workout in the user's chain
	wid := id
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var w workout.Workout
	err := db.Model(&workout.Workout{}).
		Where("workouts.id IN (?)", wSub).
		Scopes(PreloadWorkoutFull).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &w, nil
}

func (r *WorkoutRepo) GetByWorkoutCycleID(ctx context.Context, userId, planId, cycleId uint) ([]*workout.Workout, error) {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var workouts []*workout.Workout
	err := db.Model(&workout.Workout{}).
		Where("workout_cycle_id IN (?)", cSub).
		Find(&workouts).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return workouts, nil
}

func (r *WorkoutRepo) Update(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) error {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	res := db.Model(&workout.Workout{}).
		Where("id = ? AND workout_cycle_id IN (?)", id, cSub).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutRepo) UpdateReturning(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) (*workout.Workout, error) {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var w workout.Workout
	res := db.Model(&w).
		Where("id = ? AND workout_cycle_id IN (?)", id, cSub).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}

	// Reload children ordered
	if err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_id = ?", id).
		Order("index ASC").
		Find(&w.WorkoutExercises).Error; err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WorkoutRepo) Delete(ctx context.Context, userId, planId, cycleId, id uint) error {
	db := r.dbFrom(ctx)

	wid := id
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	res := db.Where("id IN (?)", wSub).Delete(&workout.Workout{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutRepo) GetIncompleteWorkoutsCount(ctx context.Context, userId, planId, cycleId uint) (int64, error) {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var count int64
	err := db.Model(&workout.Workout{}).
		Where("workout_cycle_id IN (?) AND completed = FALSE", cSub).
		Count(&count).Error
	return count, err
}

func (r *WorkoutRepo) GetSkippedWorkoutsCount(ctx context.Context, userId, planId, cycleId uint) (int64, error) {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var count int64
	err := db.Model(&workout.Workout{}).
		Where("workout_cycle_id IN (?) AND skipped = TRUE", cSub).
		Count(&count).Error
	return count, err
}

func (r *WorkoutRepo) GetMaxWorkoutIndexByWorkoutCycleID(ctx context.Context, userId, planId, cycleId uint) (int, error) {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var max int
	err := db.Model(&workout.Workout{}).
		Select("COALESCE(MAX(index), 0)").
		Where("workout_cycle_id IN (?)", cSub).
		Scan(&max).Error
	return max, err
}

func (r *WorkoutRepo) DecrementIndexesAfterWorkout(ctx context.Context, userId, planId, cycleId uint, deletedIndex int) error {
	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	return db.Model(&workout.Workout{}).
		Where("workout_cycle_id IN (?) AND index > ?", cSub, deletedIndex).
		Update("index", gorm.Expr("index - 1")).Error
}

func (r *WorkoutRepo) SwapWorkoutsByIndex(ctx context.Context, userId, planId, cycleId uint, index1, index2 int) error {
	if index1 == index2 {
		return nil
	}

	db := r.dbFrom(ctx)

	cid := cycleId
	cSub := SubqCycles(db, userId, planId, &cid)

	var workouts []workout.Workout
	if err := db.Where("workout_cycle_id IN (?) AND index IN (?, ?)", cSub, index1, index2).
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

func (r *WorkoutRepo) LockByIDForUpdate(ctx context.Context, userId, planId, cycleId uint, id uint) error {
	db := r.dbFrom(ctx)

	wid := id
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var w workout.Workout
	return db.Model(&workout.Workout{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workouts.id IN (?)", wSub).
		First(&w).Error
}

func (r *WorkoutRepo) GetByIDForUpdate(ctx context.Context, userId, planId, cycleId uint, id uint) (*workout.Workout, error) {
	db := r.dbFrom(ctx)

	wid := id
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var w workout.Workout
	err := db.Model(&workout.Workout{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workouts.id IN (?)", wSub).
		Scopes(PreloadWorkoutFull).
		First(&w).Error
	if err != nil {
		return nil, err
	}
	return &w, nil
}
