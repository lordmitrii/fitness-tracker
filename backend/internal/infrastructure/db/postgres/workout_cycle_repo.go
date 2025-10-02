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

func (r *WorkoutCycleRepo) Create(ctx context.Context, userId, planId uint, wc *workout.WorkoutCycle) error {
	db := r.dbFrom(ctx)

	pid := planId
	pSub := SubqPlans(db, userId, &pid)

	var cnt int64
	if err := db.Table("(?) AS wp", pSub).Count(&cnt).Error; err != nil {
		return err
	}
	if cnt == 0 {
		return custom_err.ErrNotFound
	}

	wc.WorkoutPlanID = planId
	return db.Create(wc).Error
}

func (r *WorkoutCycleRepo) GetByID(ctx context.Context, userId, planId, id uint) (*workout.WorkoutCycle, error) {
	db := r.dbFrom(ctx)

	cid := id
	cSub := SubqCycles(db, userId, planId, &cid)

	var wc workout.WorkoutCycle
	err := db.Model(&workout.WorkoutCycle{}).
		Where("workout_cycles.id IN (?)", cSub).
		Preload("Workouts", func(db *gorm.DB) *gorm.DB {
			return db.Order("index ASC").Order("id ASC")
		}).
		Preload("Workouts.WorkoutExercises.IndividualExercise.MuscleGroup").
		Preload("Workouts.WorkoutExercises.IndividualExercise.Exercise").
		Preload("Workouts.WorkoutExercises.WorkoutSets").
		First(&wc).Error
	if err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) GetByWorkoutPlanID(ctx context.Context, userId, planId uint) ([]*workout.WorkoutCycle, error) {
	db := r.dbFrom(ctx)

	pid := planId
	pSub := SubqPlans(db, userId, &pid)

	var cycles []*workout.WorkoutCycle
	err := db.Model(&workout.WorkoutCycle{}).
		Where("workout_plan_id IN (?)", pSub).
		Find(&cycles).Error
	if err != nil {
		return nil, err
	}
	return cycles, nil
}

func (r *WorkoutCycleRepo) GetByPlanIDAndWeek(ctx context.Context, userId, planID uint, week int) (*workout.WorkoutCycle, error) {
	db := r.dbFrom(ctx)

	pid := planID
	pSub := SubqPlans(db, userId, &pid)

	var cycle workout.WorkoutCycle
	err := db.Model(&workout.WorkoutCycle{}).
		Where("workout_plan_id IN (?) AND week_number = ?", pSub, week).
		Preload("Workouts", func(db *gorm.DB) *gorm.DB { return db.Order("index ASC").Order("id ASC") }).
		Preload("Workouts.WorkoutExercises").
		First(&cycle).Error
	if err != nil {
		return nil, err
	}
	return &cycle, nil
}

func (r *WorkoutCycleRepo) GetMaxWeekNumberByPlanID(ctx context.Context, userId, planId uint) (int, error) {
	db := r.dbFrom(ctx)

	pid := planId
	pSub := SubqPlans(db, userId, &pid)

	var max int
	err := db.Model(&workout.WorkoutCycle{}).
		Select("COALESCE(MAX(week_number), 0)").
		Where("workout_plan_id IN (?)", pSub).
		Scan(&max).Error
	return max, err
}

func (r *WorkoutCycleRepo) Update(ctx context.Context, userId, planId, id uint, updates map[string]any) error {
	db := r.dbFrom(ctx)

	pid := planId
	pSub := SubqPlans(db, userId, &pid)

	res := db.Model(&workout.WorkoutCycle{}).
		Where("id = ? AND workout_plan_id IN (?)", id, pSub).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutCycleRepo) UpdateReturning(ctx context.Context, userId, planId, id uint, updates map[string]any) (*workout.WorkoutCycle, error) {
	db := r.dbFrom(ctx)

	pid := planId
	pSub := SubqPlans(db, userId, &pid)

	var wc workout.WorkoutCycle
	res := db.Model(&wc).
		Where("id = ? AND workout_plan_id IN (?)", id, pSub).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}

	if err := db.Model(&workout.Workout{}).
		Where("workout_cycle_id = ?", id).
		Order("index ASC").
		Find(&wc.Workouts).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) Delete(ctx context.Context, userId, planId, id uint) error {
	db := r.dbFrom(ctx)

	cid := id
	cSub := SubqCycles(db, userId, planId, &cid)

	res := db.Where("id IN (?)", cSub).Delete(&workout.WorkoutCycle{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutCycleRepo) ClearData(ctx context.Context, userId, planId, id uint) error {
	db := r.dbFrom(ctx)

	cid := id
	cSub := SubqCycles(db, userId, planId, &cid)

	if err := db.Where("workout_cycle_id IN (?)", cSub).
		Delete(&workout.Workout{}).Error; err != nil {
		return err
	}

	res := db.Model(&workout.WorkoutCycle{}).
		Where("id IN (?)", cSub).
		Update("completed", false)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutCycleRepo) LockByIDForUpdate(ctx context.Context, userId, planId, id uint) error {
	db := r.dbFrom(ctx)

	cid := id
	cSub := SubqCycles(db, userId, planId, &cid)

	var wc workout.WorkoutCycle
	return db.Model(&workout.WorkoutCycle{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workout_cycles.id IN (?)", cSub).
		First(&wc).Error
}

func (r *WorkoutCycleRepo) GetByIDForUpdate(ctx context.Context, userId, planId, id uint) (*workout.WorkoutCycle, error) {
	db := r.dbFrom(ctx)

	cid := id
	cSub := SubqCycles(db, userId, planId, &cid)

	var wc workout.WorkoutCycle
	err := db.Model(&workout.WorkoutCycle{}).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("workout_cycles.id IN (?)", cSub).
		Preload("Workouts", func(db *gorm.DB) *gorm.DB {
			return db.Preload("WorkoutExercises.IndividualExercise.MuscleGroup").
				Preload("WorkoutExercises.IndividualExercise.Exercise").
				Preload("WorkoutExercises.WorkoutSets").
				Order("index ASC").Order("id ASC")
		}).
		First(&wc).Error
	if err != nil {
		return nil, err
	}
	return &wc, nil
}
