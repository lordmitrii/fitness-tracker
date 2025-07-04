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
	if err := r.db.WithContext(ctx).Preload("Workouts", func(db *gorm.DB) *gorm.DB {
		return db.Preload("WorkoutExercises").Preload("WorkoutExercises.IndividualExercise").Order("index ASC").Order("id ASC")
	}).First(&wc, id).Error; err != nil {
		return nil, err
	}
	return &wc, nil
}

func (r *WorkoutCycleRepo) GetByPlanIDAndWeek(ctx context.Context, planID uint, week int) (*workout.WorkoutCycle, error) {
	var cycle workout.WorkoutCycle
	err := r.db.WithContext(ctx).
		Preload("Workouts", func(db *gorm.DB) *gorm.DB { return db.Order("index ASC").Order("id ASC") }).
		Preload("Workouts.WorkoutExercises").
		Where("workout_plan_id = ? AND week_number = ?", planID, week).
		First(&cycle).Error

	return &cycle, err
}

func (r *WorkoutCycleRepo) GetByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	var workoutCycles []*workout.WorkoutCycle
	if err := r.db.WithContext(ctx).Where("workout_plan_id = ?", workoutPlanID).Find(&workoutCycles).Error; err != nil {
		return nil, err
	}
	return workoutCycles, nil
}

func (r *WorkoutCycleRepo) GetMaxWeekNumberByPlanID(ctx context.Context, planID uint) (int, error) {
	var max int
	err := r.db.WithContext(ctx).
		Model(&workout.WorkoutCycle{}).
		Where("workout_plan_id = ?", planID).
		Select("COALESCE(MAX(week_number), 0)").
		Scan(&max).Error

	return max, err
}

func (r *WorkoutCycleRepo) Update(ctx context.Context, wc *workout.WorkoutCycle) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutCycle{ID: wc.ID}).Updates(wc).Error
}

func (r *WorkoutCycleRepo) UpdateNextCycleID(ctx context.Context, id, nextID uint) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutCycle{}).Where("id = ?", id).Update("next_cycle_id", nextID).Error
}

func (r *WorkoutCycleRepo) UpdatePrevCycleID(ctx context.Context, id, previousID uint) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutCycle{}).Where("id = ?", id).Update("previous_cycle_id", previousID).Error
}

func (r *WorkoutCycleRepo) Complete(ctx context.Context, wc *workout.WorkoutCycle) error {
	return r.db.WithContext(ctx).Model(&workout.WorkoutCycle{}).Where("id = ?", wc.ID).Select("completed").Updates(wc).Error
}

func (r *WorkoutCycleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&workout.WorkoutCycle{}, id).Error
}

func (r *WorkoutCycleRepo) ClearData(ctx context.Context, id uint) error {
	// Delete all workouts attached to this cycle
	if err := r.db.WithContext(ctx).
		Where("workout_cycle_id = ?", id).
		Delete(&workout.Workout{}).Error; err != nil {
		return err
	}

	// Set Completed to false
	if err := r.db.WithContext(ctx).
		Model(&workout.WorkoutCycle{}).
		Where("id = ?", id).
		Update("completed", false).Error; err != nil {
		return err
	}

	return nil
}
