package postgres

import (
	"context"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

type WorkoutPlanRepo struct {
	db *gorm.DB
}

func NewWorkoutPlanRepo(db *gorm.DB) workout.WorkoutPlanRepository {
	return &WorkoutPlanRepo{db: db}
}

func (r *WorkoutPlanRepo) Create(ctx context.Context, wp *workout.WorkoutPlan) error {
	return r.db.WithContext(ctx).Create(wp).Error
}

func (r *WorkoutPlanRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	var wp workout.WorkoutPlan
	if err := r.db.WithContext(ctx).Preload("WorkoutCycles", func(db *gorm.DB) *gorm.DB { return db.Order("week_number ASC").Order("id ASC") }).First(&wp, id).Error; err != nil {
		return nil, err
	}
	return &wp, nil
}

func (r *WorkoutPlanRepo) GetByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	var workoutPlans []*workout.WorkoutPlan
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&workoutPlans).Error; err != nil {
		return nil, err
	}
	return workoutPlans, nil
}

func (r *WorkoutPlanRepo) Update(ctx context.Context, wp *workout.WorkoutPlan) error {
	res := r.db.WithContext(ctx).Model(&workout.WorkoutPlan{}).Where("id = ?", wp.ID).Updates(wp)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}

func (r *WorkoutPlanRepo) Delete(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&workout.WorkoutPlan{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return custom_err.ErrNotFound
	}
	return nil
}
