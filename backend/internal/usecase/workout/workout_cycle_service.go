package workout

import (
	"context"
	"fmt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"time"
)

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
		t := time.Now().AddDate(0, 0, w.Index)
		newWorkout := &workout.Workout{
			Name:              w.Name,
			WorkoutCycleID:    cycle.ID,
			Index:             w.Index,
			Date:              &t,
			Completed:         false,
			PreviousWorkoutID: w.ID,
		}
		// Copy exercises from the previous workout
		for _, we := range w.WorkoutExercises {
			newExercise := &workout.WorkoutExercise{
				WorkoutID:            newWorkout.ID,
				IndividualExerciseID: we.IndividualExerciseID,
				Index:                we.Index,
				Completed:            false,
			}
			// Copy sets from the previous workout exercise
			for _, ws := range we.WorkoutSets {
				// Add previous weight and reps if these are null
				if ws.Weight == nil {
					ws.Weight = ws.PreviousWeight
				}
				if ws.Reps == nil {
					ws.Reps = ws.PreviousReps
				}
				newSet := &workout.WorkoutSet{
					WorkoutExerciseID: newExercise.ID,
					Index:             ws.Index,
					PreviousWeight:    ws.Weight,
					PreviousReps:      ws.Reps,
					Completed:         false,
				}
				newExercise.WorkoutSets = append(newExercise.WorkoutSets, newSet)
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
		// prevCycleIncompleteWorkoutsCounts, err := s.workoutRepo.GetIncompleteWorkoutsCount(ctx, cycle.PreviousCycleID)
		// if err != nil {
		// 	return err
		// }

		// // If there is no next cycle and all previous workouts are completed, we just clear the current cycle data and dont change anything
		// if prevCycleIncompleteWorkoutsCounts == 0 {
		// 	if err := s.workoutCycleRepo.ClearData(ctx, id); err != nil {
		// 		return err
		// 	}
		// 	return nil
		// }

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

func (s *workoutServiceImpl) GetCurrentWorkoutCycle(ctx context.Context, userID uint) (*workout.WorkoutCycle, error) {
	plans, err := s.workoutPlanRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var activePlan *workout.WorkoutPlan
	for _, p := range plans {
		if p.Active {
			activePlan = p
			break
		}
	}

	if activePlan == nil {
		return nil, fmt.Errorf("no active workout plan found")
	}

	if activePlan.CurrentCycleID == 0 {
		return nil, fmt.Errorf("active workout plan has no current cycle")
	}

	cycle, err := s.workoutCycleRepo.GetByID(ctx, activePlan.CurrentCycleID)
	if err != nil {
		return nil, err
	}

	return cycle, nil
}
