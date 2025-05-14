package inmemory

import (
	"context"
	"errors"
	"sync"
	"time"
	"slices"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type WorkoutRepo struct {
	mu       sync.Mutex
	workouts []*workout.Workout
	nextID   uint
}

func NewWorkoutRepo() *WorkoutRepo {
	return &WorkoutRepo{
		workouts: make([]*workout.Workout, 0),
		nextID:   1,
	}
}

func (r *WorkoutRepo) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	w.ID = r.nextID
	w.CreatedAt = time.Now()
	r.nextID++
	r.workouts = append(r.workouts, w)
	return nil
}

func (r *WorkoutRepo) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, w := range r.workouts {
		if w.ID == id {
			return w, nil
		}
	}
	return nil, errors.New("workout not found")
}

func (r *WorkoutRepo) ListWorkouts(ctx context.Context) ([]*workout.Workout, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	return r.workouts, nil
}

func (r *WorkoutRepo) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i := range r.workouts {
		if r.workouts[i].ID == w.ID {
			w.CreatedAt = r.workouts[i].CreatedAt // preserve original date
			r.workouts[i] = w
			return nil
		}
	}
	return errors.New("workout not found")
}

func (r *WorkoutRepo) DeleteWorkout(ctx context.Context, id uint) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, w := range r.workouts {
		if w.ID == id {
			r.workouts = slices.Delete(r.workouts, i, i+1)
			return nil
		}
	}
	return errors.New("workout not found")
}
