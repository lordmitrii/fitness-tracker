package postgres

import (
    "context"
    "errors"

    "github.com/lordmitrii/golang-web-gin/internal/domain/workout"
    "gorm.io/gorm"
)

// ErrNotFound is returned when a workout is not found.
var ErrNotFound = errors.New("workout not found")

// WorkoutRepo implements workout.Repository using PostgreSQL.
type WorkoutRepo struct {
    db *gorm.DB
}

func NewWorkoutRepo(db *gorm.DB) workout.Repository {
    return &WorkoutRepo{db: db}
}

func (r *WorkoutRepo) CreateWorkout(ctx context.Context, w *workout.Workout) error {
    return r.db.WithContext(ctx).Create(w).Error
}

func (r *WorkoutRepo) ListWorkouts(ctx context.Context) ([]*workout.Workout, error) {
    var list []*workout.Workout
	if err := r.db.WithContext(ctx).
		Find(&list).
		Error; err != nil {
		return nil, err
	}
    return list, nil
}

func (r *WorkoutRepo) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
    var w workout.Workout
    if err := r.db.WithContext(ctx).
        First(&w, id).
        Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &w, nil
}

func (r *WorkoutRepo) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
    res := r.db.WithContext(ctx).
        Model(&workout.Workout{}).
        Where("id = ?", w.ID).
        Updates(w)
    if res.Error != nil {
        return res.Error
    }
    if res.RowsAffected == 0 {
        return ErrNotFound
    }
    return nil
}

func (r *WorkoutRepo) DeleteWorkout(ctx context.Context, id uint) error {
    res := r.db.WithContext(ctx).
        Delete(&workout.Workout{}, id)
    if res.Error != nil {
        return res.Error
    }
    if res.RowsAffected == 0 {
        return ErrNotFound
    }
    return nil
}