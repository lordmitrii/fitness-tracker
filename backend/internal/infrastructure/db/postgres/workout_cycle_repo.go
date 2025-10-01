package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WorkoutCycleRepo struct {
	db *gorm.DB
}

func NewWorkoutCycleRepo(db *gorm.DB) workout.WorkoutCycleRepository {
	return &WorkoutCycleRepo{db: db}
}

func (r *WorkoutCycleRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *WorkoutCycleRepo) Create(ctx context.Context, wc *workout.WorkoutCycle) error {
	return r.dbFrom(ctx).Create(wc).Error
}

func (r *WorkoutCycleRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error) {
	var wc workout.WorkoutCycle
	if err := r.dbFrom(ctx).Preload("Workouts", func(db *gorm.DB) *gorm.DB {
		return db.Preload("WorkoutExercises.IndividualExercise.MuscleGroup").Preload("WorkoutExercises.IndividualExercise.Exercise").Preload("WorkoutExercises.WorkoutSets").Order("index ASC").Order("id ASC")
	}).First(&wc, id).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) GetByPlanIDAndWeek(ctx context.Context, planID uint, week int) (*workout.WorkoutCycle, error) {
	var cycle workout.WorkoutCycle
	err := r.dbFrom(ctx).
		Preload("Workouts", func(db *gorm.DB) *gorm.DB { return db.Order("index ASC").Order("id ASC") }).
		Preload("Workouts.WorkoutExercises").
		Where("workout_plan_id = ? AND week_number = ?", planID, week).
		First(&cycle).Error

	return &cycle, err
}

func (r *WorkoutCycleRepo) GetByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	var workoutCycles []*workout.WorkoutCycle
	if err := r.dbFrom(ctx).Where("workout_plan_id = ?", workoutPlanID).Find(&workoutCycles).Error; err != nil {
		return nil, err
	}
	return workoutCycles, nil
}

func (r *WorkoutCycleRepo) GetMaxWeekNumberByPlanID(ctx context.Context, planID uint) (int, error) {
	var max int
	err := r.dbFrom(ctx).
		Model(&workout.WorkoutCycle{}).
		Where("workout_plan_id = ?", planID).
		Select("COALESCE(MAX(week_number), 0)").
		Scan(&max).Error

	return max, err
}

func (r *WorkoutCycleRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).
		Model(&workout.WorkoutCycle{}).
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

func (r *WorkoutCycleRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutCycle, error) {
	var wc workout.WorkoutCycle
	tx := r.dbFrom(ctx)

	res := tx.Model(&wc).
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
		Model(&workout.Workout{}).
		Where("workout_cycle_id = ?", id).
		Order("index ASC").
		Find(&wc.Workouts).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).Delete(&workout.WorkoutCycle{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutCycleRepo) ClearData(ctx context.Context, id uint) error {
	// Delete all workouts attached to this cycle
	if err := r.dbFrom(ctx).
		Where("workout_cycle_id = ?", id).
		Delete(&workout.Workout{}).Error; err != nil {
		return err
	}

	// Set Completed to false
	if err := r.dbFrom(ctx).
		Model(&workout.WorkoutCycle{}).
		Where("id = ?", id).
		Update("completed", false).Error; err != nil {
		return err
	}

	return nil
}

func (r *WorkoutCycleRepo) LockByIDForUpdate(ctx context.Context, id uint) error {
	var wc workout.WorkoutCycle
	return r.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&wc, id).Error
}

func (r *WorkoutCycleRepo) GetByIDForUpdate(ctx context.Context, id uint) (*workout.WorkoutCycle, error) {
	var wc workout.WorkoutCycle
	if err := r.dbFrom(ctx).Preload("Workouts", func(db *gorm.DB) *gorm.DB {
		return db.Preload("WorkoutExercises.IndividualExercise.MuscleGroup").Preload("WorkoutExercises.IndividualExercise.Exercise").Preload("WorkoutExercises.WorkoutSets").Order("index ASC").Order("id ASC")
	}).Clauses(clause.Locking{Strength: "UPDATE"}).First(&wc, id).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}
