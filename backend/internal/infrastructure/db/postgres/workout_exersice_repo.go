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

func (r *WorkoutExerciseRepo) GetOnlyByID(ctx context.Context, userId, id uint) (*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)
	var we workout.WorkoutExercise
	err := db.Model(&workout.WorkoutExercise{}).
		Joins("JOIN workouts w  ON w.id  = workout_exercises.workout_id").
		Joins("JOIN workout_cycles wc ON wc.id = w.workout_cycle_id").
		Joins("JOIN workout_plans  wp ON wp.id = wc.workout_plan_id").
		Where("workout_exercises.id = ? AND wp.user_id = ?", id, userId).
		First(&we).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &we, nil
}

func (r *WorkoutExerciseRepo) Create(ctx context.Context, userId, planId, cycleId, workoutId uint, e *workout.WorkoutExercise) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var cnt int64
	if err := db.Table("(?) AS w", wSub).Count(&cnt).Error; err != nil {
		return err
	}
	if cnt == 0 {
		return custom_err.ErrNotFound
	}

	e.WorkoutID = workoutId
	return db.Create(e).Error
}

func (r *WorkoutExerciseRepo) GetByID(ctx context.Context, userId, planId, cycleId, workoutId, id uint) (*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)

	weid := id
	subq := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weid)

	var e workout.WorkoutExercise
	err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_exercises.id IN (?)", subq).
		Scopes(PreloadWorkoutExerciseFull).
		First(&e).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return &e, nil
}

func (r *WorkoutExerciseRepo) GetByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) ([]*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var exercises []*workout.WorkoutExercise
	err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?)", wSub).
		Scopes(PreloadWorkoutExerciseFull).
		Find(&exercises).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, custom_err.ErrNotFound
		}
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) Update(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	res := db.Model(&workout.WorkoutExercise{}).
		Where("id = ? AND workout_id IN (?)", id, wSub).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutExerciseRepo) UpdateReturning(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) (*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var we workout.WorkoutExercise
	res := db.Model(&we).
		Where("id = ? AND workout_id IN (?)", id, wSub).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}

	if err := db.Model(&workout.WorkoutSet{}).
		Where("workout_exercise_id = ?", id).
		Order("index ASC").
		Find(&we.WorkoutSets).Error; err != nil {
		return nil, err
	}
	if we.IndividualExerciseID != 0 {
		var ie workout.IndividualExercise
		if err := db.Preload("MuscleGroup").Preload("Exercise").
			First(&ie, we.IndividualExerciseID).Error; err != nil {
			return nil, err
		}
		we.IndividualExercise = &ie
	} else {
		we.IndividualExercise = nil
	}

	return &we, nil
}

func (r *WorkoutExerciseRepo) Delete(ctx context.Context, userId, planId, cycleId, workoutId, id uint) error {
	db := r.dbFrom(ctx)

	weid := id
	subq := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weid)

	res := db.Where("id IN (?)", subq).Delete(&workout.WorkoutExercise{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutExerciseRepo) GetPendingExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var count int64
	err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?) AND completed = FALSE AND skipped = FALSE", wSub).
		Count(&count).Error
	return count, err
}

func (r *WorkoutExerciseRepo) GetTotalExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)
	var count int64
	err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?)", wSub).
		Count(&count).Error
	return count, err
}

func (r *WorkoutExerciseRepo) GetSkippedExercisesCount(ctx context.Context, userId, planId, cycleId, workoutId uint) (int64, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var count int64
	err := db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?) AND skipped = TRUE", wSub).
		Count(&count).Error
	return count, err
}

func (r *WorkoutExerciseRepo) GetLast5ByIndividualExerciseID(ctx context.Context, userId, individualExerciseID uint) ([]*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)

	var exercises []*workout.WorkoutExercise
	err := db.Model(&workout.WorkoutExercise{}).
		Joins("JOIN individual_exercises ie ON ie.id = workout_exercises.individual_exercise_id").
		Where("workout_exercises.individual_exercise_id = ? AND ie.user_id = ?", individualExerciseID, userId).
		Joins("JOIN workout_sets ON workout_sets.workout_exercise_id = workout_exercises.id").
		Where("workout_sets.reps IS NOT NULL AND workout_sets.weight IS NOT NULL").
		Order("workout_exercises.created_at DESC").
		Preload("WorkoutSets").
		Limit(5).
		Find(&exercises).Error
	if err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *WorkoutExerciseRepo) GetMaxIndexByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) (int, error) {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var max int
	err := db.Model(&workout.WorkoutExercise{}).
		Select("COALESCE(MAX(index), 0)").
		Where("workout_id IN (?)", wSub).
		Scan(&max).Error
	return max, err
}

func (r *WorkoutExerciseRepo) DecrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId uint, deletedIndex int) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	return db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?) AND index > ?", wSub, deletedIndex).
		Update("index", gorm.Expr("index - 1")).Error
}

func (r *WorkoutExerciseRepo) IncrementIndexesAfter(ctx context.Context, userId, planId, cycleId, workoutId uint, index int) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	return db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?) AND index >= ?", wSub, index).
		Update("index", gorm.Expr("index + 1")).Error
}

func (r *WorkoutExerciseRepo) SwapWorkoutExercisesByIndex(ctx context.Context, userId, planId, cycleId, workoutId uint, index1, index2 int) error {
	if index1 == index2 {
		return nil
	}
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	var exercises []workout.WorkoutExercise
	if err := db.Where("workout_id IN (?) AND index IN (?, ?)", wSub, index1, index2).
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

func (r *WorkoutExerciseRepo) LockByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId uint, id uint) error {
	db := r.dbFrom(ctx)

	weid := id
	subq := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weid)

	var we workout.WorkoutExercise
	return db.Model(&workout.WorkoutExercise{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workout_exercises.id IN (?)", subq).
		First(&we).Error
}

func (r *WorkoutExerciseRepo) GetByIDForUpdate(ctx context.Context, userId, planId, cycleId, workoutId uint, id uint) (*workout.WorkoutExercise, error) {
	db := r.dbFrom(ctx)

	weid := id
	subq := SubqWorkoutExercises(db, userId, planId, cycleId, workoutId, &weid)

	var we workout.WorkoutExercise
	err := db.Model(&workout.WorkoutExercise{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workout_exercises.id IN (?)", subq).
		Scopes(PreloadWorkoutExerciseFull).
		First(&we).Error
	if err != nil {
		return nil, err
	}
	return &we, nil
}

func (r *WorkoutExerciseRepo) MarkAllExercisesPending(ctx context.Context, userId, planId, cycleId, workoutId uint) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	return db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?)", wSub).
		Updates(map[string]any{
			"completed": false,
			"skipped":   false,
		}).Error
}

func (r *WorkoutExerciseRepo) MarkAllPendingExercisesSkipped(ctx context.Context, userId, planId, cycleId, workoutId uint) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	return db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?) AND completed = FALSE AND skipped = FALSE", wSub).
		Update("skipped", true).Error
}

func (r *WorkoutExerciseRepo) MarkAllExercisesCompleted(ctx context.Context, userId, planId, cycleId, workoutId uint) error {
	db := r.dbFrom(ctx)

	wid := workoutId
	wSub := SubqWorkouts(db, userId, planId, cycleId, &wid)

	return db.Model(&workout.WorkoutExercise{}).
		Where("workout_id IN (?)", wSub).
		Updates(map[string]any{
			"completed": true,
			"skipped":   false,
		}).Error
}