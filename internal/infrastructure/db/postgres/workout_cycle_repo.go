package postgres

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"gorm.io/gorm"
)

type WorkoutCycleRepo struct {
	db *gorm.DB
}

func NewWorkoutCycleRepo(db *gorm.DB) workout.WorkoutCycleRepository {
	return &WorkoutCycleRepo{db: db}
}

func (r *WorkoutCycleRepo) Create(ctx context.Context, wc *workout.WorkoutCycle) error {
	return r.db.WithContext(ctx).Create(wc).Error
}

func (r *WorkoutCycleRepo) GetByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error) {
	var wc workout.WorkoutCycle
	if err := r.db.WithContext(ctx).Preload("Workouts").First(&wc, id).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) GetByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	var workoutCycles []*workout.WorkoutCycle
	if err := r.db.WithContext(ctx).Where("workout_plan_id = ?", workoutPlanID).Find(&workoutCycles).Error; err != nil {
		return nil, err
	}
	return workoutCycles, nil
}

func (r *WorkoutCycleRepo) Update(ctx context.Context, wc *workout.WorkoutCycle) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutCycle{ID: wc.ID}).Updates(wc).Error
}

func (r *WorkoutCycleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.WorkoutCycle{}, id).Error
}
