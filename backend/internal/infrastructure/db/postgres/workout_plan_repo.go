package postgres

import (
	"context"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WorkoutPlanRepo struct {
	db *gorm.DB
}

func NewWorkoutPlanRepo(db *gorm.DB) workout.WorkoutPlanRepository {
	return &WorkoutPlanRepo{db: db}
}

func (r *WorkoutPlanRepo) dbFrom(ctx context.Context) *gorm.DB {
	if tx, ok := txctx.From(ctx); ok {
		return tx.WithContext(ctx)
	}
	return r.db.WithContext(ctx)
}

func (r *WorkoutPlanRepo) Create(ctx context.Context, wp *workout.WorkoutPlan) error {
	return r.dbFrom(ctx).Create(wp).Error
}

func (r *WorkoutPlanRepo) CreateReturning(ctx context.Context, wp *workout.WorkoutPlan) (*workout.WorkoutPlan, error) {
	res := r.dbFrom(ctx).
		Clauses(clause.Returning{}).
		Create(wp)
	if res.Error != nil {
		return nil, res.Error
	}
	return wp, nil
}

func (r *WorkoutPlanRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	var wp workout.WorkoutPlan
	if err := r.dbFrom(ctx).First(&wp, id).Error; err != nil {
		return nil, err
	}
	return &wp, nil
}

func (r *WorkoutPlanRepo) GetByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	var workoutPlans []*workout.WorkoutPlan
	if err := r.dbFrom(ctx).Where("user_id = ?", userID).Find(&workoutPlans).Error; err != nil {
		return nil, err
	}
	return workoutPlans, nil
}

func (r *WorkoutPlanRepo) Update(ctx context.Context, id uint, updates map[string]any) error {
	res := r.dbFrom(ctx).
		Model(&workout.WorkoutPlan{}).
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

func (r *WorkoutPlanRepo) UpdateReturning(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutPlan, error) {
	var wp workout.WorkoutPlan
	db := r.dbFrom(ctx)

	res := db.Model(&wp).
		Where("id = ?", id).
		Clauses(clause.Returning{}).
		Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, custom_err.ErrNotFound
	}

	if err := db.
		Model(&workout.WorkoutCycle{}).
		Where("workout_plan_id = ?", id).
		Order("week_number ASC").
		Find(&wp.WorkoutCycles).Error; err != nil {
		return nil, err
	}
	return &wp, nil
}

func (r *WorkoutPlanRepo) Delete(ctx context.Context, id uint) error {
	res := r.dbFrom(ctx).Delete(&workout.WorkoutPlan{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutPlanRepo) DeactivateOthers(ctx context.Context, userID, keepID uint) error {
	return r.dbFrom(ctx).
		Model(&workout.WorkoutPlan{}).
		Where("user_id = ? AND active = TRUE AND id <> ?", userID, keepID).
		Update("active", false).Error
}

func (s *WorkoutPlanRepo) GetByIDForUpdate(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	var wp workout.WorkoutPlan
	if err := s.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&wp, id).Error; err != nil {
		return nil, err
	}
	return &wp, nil
}

func (r *WorkoutPlanRepo) LockByIDForUpdate(ctx context.Context, id uint) error {
	var wp workout.WorkoutPlan
	return r.dbFrom(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).First(&wp, id).Error
}