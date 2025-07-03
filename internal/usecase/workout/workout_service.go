package workout

import (
	"context"
	"fmt"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type workoutServiceImpl struct {
	workoutPlanRepo  workout.WorkoutPlanRepository
	workoutCycleRepo workout.WorkoutCycleRepository
	workoutRepo      workout.WorkoutRepository
	exerciseRepo     workout.WorkoutExerciseRepository
}

func NewWorkoutService(workoutPlanRepo workout.WorkoutPlanRepository, workoutCycleRepo workout.WorkoutCycleRepository, workoutRepo workout.WorkoutRepository, exerciseRepo workout.WorkoutExerciseRepository) *workoutServiceImpl {
	return &workoutServiceImpl{
		workoutPlanRepo:  workoutPlanRepo,
		workoutCycleRepo: workoutCycleRepo,
		workoutRepo:      workoutRepo,
		exerciseRepo:     exerciseRepo,
	}
}

func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	// Create the workout plan with the initial cycle
	if err := s.workoutPlanRepo.Create(ctx, wp); err != nil {
		return err
	}

	firstCycle := &workout.WorkoutCycle{
		WorkoutPlanID: wp.ID,
		WeekNumber:    1,
		Name:          "Week #1",
	}

	if err := s.workoutCycleRepo.Create(ctx, firstCycle); err != nil {
		return err
	}

	wp.CurrentCycleID = firstCycle.ID
	if err := s.workoutPlanRepo.Update(ctx, wp); err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, id)

}

func (s *workoutServiceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

func (s *workoutServiceImpl) UpdateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	return s.workoutPlanRepo.Update(ctx, wp)
}

func (s *workoutServiceImpl) DeleteWorkoutPlan(ctx context.Context, id uint) error {
	return s.workoutPlanRepo.Delete(ctx, id)
}

func (s *workoutServiceImpl) CreateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error {
	return s.workoutCycleRepo.Create(ctx, wc)
}

func (s *workoutServiceImpl) GetWorkoutCycleByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error) {
	cycle, err := s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if len(cycle.Workouts) != 0 || cycle.PreviousCycleID == 0 {
		return cycle, nil
	}

	prevCycle, err := s.workoutCycleRepo.GetByID(ctx, cycle.PreviousCycleID)
	if err != nil {
		return nil, err
	}

	if len(prevCycle.Workouts) == 0 {
		return cycle, nil
	}

	var newWorkouts []*workout.Workout
	for _, w := range prevCycle.Workouts {
		newWorkout := &workout.Workout{
			Name:              w.Name,
			WorkoutCycleID:    cycle.ID,
			Index:             w.Index,
			Date:              time.Now().AddDate(0, 0, w.Index),
			Completed:         false,
			PreviousWorkoutID: w.ID,
		}
		// Copy exercises from the previous workout
		for _, we := range w.WorkoutExercises {
			newExercise := &workout.WorkoutExercise{
				WorkoutID:  newWorkout.ID,
				ExerciseID: we.ExerciseID,
				Sets:       we.Sets,
				Reps:       we.Reps,
				Weight:     we.Weight,
				Completed:  false,
			}
			newWorkout.WorkoutExercises = append(newWorkout.WorkoutExercises, newExercise)
		}
		newWorkouts = append(newWorkouts, newWorkout)
	}

	// Save new workouts
	if err := s.workoutRepo.BulkCreate(ctx, newWorkouts); err != nil {
		return nil, err
	}

	// Reload cycle with workouts
	cycle, err = s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return cycle, nil
}

func (s *workoutServiceImpl) GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	return s.workoutCycleRepo.GetByWorkoutPlanID(ctx, workoutPlanID)
}

func (s *workoutServiceImpl) UpdateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error {
	return s.workoutCycleRepo.Update(ctx, wc)
}

func (s *workoutServiceImpl) CompleteWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) (uint, error) {
	if err := s.workoutCycleRepo.Complete(ctx, wc); err != nil {
		return 0, err
	}

	wc, err := s.workoutCycleRepo.GetByID(ctx, wc.ID)
	if err != nil {
		return 0, err
	}

	// If the cycle is completed, we need to create a new cycle for the next week if it is not already created
	if wc.Completed {
		wp, err := s.workoutPlanRepo.GetByID(ctx, wc.WorkoutPlanID)
		if err != nil {
			return 0, err
		}

		if wp.CurrentCycleID == wc.ID {
			// Create a new cycle for the next week
			nextWeek := wc.WeekNumber + 1

			newCycle := &workout.WorkoutCycle{
				WorkoutPlanID:   wp.ID,
				WeekNumber:      nextWeek,
				Name:            fmt.Sprintf("Week #%d", nextWeek),
				PreviousCycleID: wc.ID,
			}

			if err := s.workoutCycleRepo.Create(ctx, newCycle); err != nil {
				return 0, err
			}

			wc.NextCycleID = newCycle.ID
			if err := s.workoutCycleRepo.Update(ctx, wc); err != nil {
				return 0, err
			}

			wp.CurrentCycleID = newCycle.ID
			if err := s.workoutPlanRepo.Update(ctx, wp); err != nil {
				return 0, err
			}
		}
	}

	return wc.NextCycleID, nil
}

func (s *workoutServiceImpl) DeleteWorkoutCycle(ctx context.Context, id uint) error {
	cycle, err := s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	plan, err := s.workoutPlanRepo.GetByID(ctx, cycle.WorkoutPlanID)
	if err != nil {
		return err
	}

	if cycle.PreviousCycleID == 0 {
		return fmt.Errorf("cannot delete the first cycle of a workout plan")
	}

	if cycle.NextCycleID != 0 {
		// Move pointer from the previous cycle to the next cycle

		if err := s.workoutCycleRepo.UpdateNextCycleID(ctx, cycle.PreviousCycleID, cycle.NextCycleID); err != nil {
			return err
		}

		if err := s.workoutCycleRepo.UpdatePrevCycleID(ctx, cycle.NextCycleID, cycle.PreviousCycleID); err != nil {
			return err
		}

		if plan.CurrentCycleID == cycle.ID {
			plan.CurrentCycleID = cycle.NextCycleID
			if err := s.workoutPlanRepo.Update(ctx, plan); err != nil {
				return err
			}
		}
	} else {
		prevCycleIncompleteWorkoutsCounts, err := s.workoutRepo.GetIncompleteWorkoutsCount(ctx, cycle.PreviousCycleID)
		if err != nil {
			return err
		}

		// If there is no next cycle and all previous workouts are completed, we just clear the current cycle data and dont change anything
		if prevCycleIncompleteWorkoutsCounts == 0 {
			if err := s.workoutCycleRepo.ClearData(ctx, id); err != nil {
				return err
			}
			return nil
		}

		if err := s.workoutCycleRepo.Complete(ctx, &workout.WorkoutCycle{ID: cycle.PreviousCycleID, Completed: false}); err != nil {
			return err
		}

		if err := s.workoutCycleRepo.UpdateNextCycleID(ctx, cycle.PreviousCycleID, 0); err != nil {
			return err
		}

		if plan.CurrentCycleID == cycle.ID {
			plan.CurrentCycleID = cycle.PreviousCycleID
			if err := s.workoutPlanRepo.Update(ctx, plan); err != nil {
				return err
			}
		}
	}
	return s.workoutCycleRepo.Delete(ctx, id)

}

func (s *workoutServiceImpl) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.workoutRepo.Create(ctx, w)
}

func (s *workoutServiceImpl) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	return s.workoutRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutsByWorkoutCycleID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error) {
	return s.workoutRepo.GetByWorkoutCycleID(ctx, workoutPlanID)
}
func (s *workoutServiceImpl) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.workoutRepo.Update(ctx, w)
}
func (s *workoutServiceImpl) DeleteWorkout(ctx context.Context, id uint) error {
	return s.workoutRepo.Delete(ctx, id)
}
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	return s.exerciseRepo.Create(ctx, e)
}
func (s *workoutServiceImpl) GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	return s.exerciseRepo.GetByWorkoutID(ctx, workoutID)
}

func (s *workoutServiceImpl) UpdateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	return s.exerciseRepo.Update(ctx, e)
}

func (s *workoutServiceImpl) CompleteWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	err := s.exerciseRepo.Complete(ctx, e)
	if err != nil {
		return err
	}

	w, err := s.workoutRepo.GetByID(ctx, e.WorkoutID)
	if err != nil {
		return err
	}

	incompletedExercisesCount, err := s.exerciseRepo.GetIncompleteExercisesCount(ctx, w.ID)
	if err != nil {
		return err
	}

	w.Completed = incompletedExercisesCount == 0

	err = s.workoutRepo.Complete(ctx, w)
	if err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}
