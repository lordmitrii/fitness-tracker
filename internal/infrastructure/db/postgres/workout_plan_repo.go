package postgres

import (
	"context"
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
	if err := r.db.WithContext(ctx).Preload("WorkoutCycles", func(db *gorm.DB) *gorm.DB {return db.Order("id ASC")}).First(&wp, id).Error; err != nil {
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
	return r.db.WithContext(ctx).Save(wp).Error
}

func (r *WorkoutPlanRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.WorkoutPlan{}, id).Error
}
