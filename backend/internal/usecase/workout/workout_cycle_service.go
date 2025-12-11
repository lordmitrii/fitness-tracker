package workout

import (
	"context"
	"fmt"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

// Order of locks used:
// 1. workout_cycles
func (s *workoutServiceImpl) CreateWorkoutCycle(ctx context.Context, userId, planId uint, wc *workout.WorkoutCycle) error {
	return s.tx.Do(ctx, func(ctx context.Context) error {
		return s.workoutCycleRepo.Create(ctx, userId, planId, wc)
	})
}

// Order of locks used:
// 1. workout_cycles
// 2. workout_exercises
func (s *workoutServiceImpl) GetWorkoutCycleByID(ctx context.Context, userId, planId, id uint) (*workout.WorkoutCycle, error) {
	var cycle *workout.WorkoutCycle
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutCycleRepo.GetByIDForUpdate(ctx, userId, planId, id)
		if err != nil {
			return err
		}
		cycle = res

		if len(cycle.Workouts) != 0 || cycle.PreviousCycleID == nil {
			return nil
		}

		prevCycle, err := s.workoutCycleRepo.GetByID(ctx, userId, planId, *cycle.PreviousCycleID)
		if err != nil {
			return err
		}

		if len(prevCycle.Workouts) == 0 {
			return nil
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
				PreviousWorkoutID: &w.ID,
			}
			for _, we := range w.WorkoutExercises {
				newExercise := &workout.WorkoutExercise{
					WorkoutID:            newWorkout.ID,
					IndividualExerciseID: we.IndividualExerciseID,
					Index:                we.Index,
					Completed:            false,
				}
				for _, ws := range we.WorkoutSets {
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

		if err := s.workoutRepo.BulkCreate(ctx, userId, planId, id, newWorkouts); err != nil {
			return err
		}

		cycle, err = s.workoutCycleRepo.GetByID(ctx, userId, planId, id)
		return err
	})
	return cycle, err
}

func (s *workoutServiceImpl) GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, userId, planId uint) ([]*workout.WorkoutCycle, error) {
	return s.workoutCycleRepo.GetByWorkoutPlanID(ctx, userId, planId)
}

func (s *workoutServiceImpl) UpdateWorkoutCycle(ctx context.Context, userId, planId, id uint, updates map[string]any) (*workout.WorkoutCycle, error) {
	var wc *workout.WorkoutCycle
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutCycleRepo.UpdateReturning(ctx, userId, planId, id, updates)
		if err != nil {
			return err
		}
		wc = res
		return nil
	})
	return wc, err
}

// Order of locks used:
// 1. workout_plans
// 2. workout_cycles
func (s *workoutServiceImpl) CompleteWorkoutCycle(ctx context.Context, userId, planId, id uint, completed, skipped bool) (*workout.WorkoutCycle, error) {
	var wc *workout.WorkoutCycle
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		wp, err := s.workoutPlanRepo.GetByIDForUpdate(ctx, userId, planId)
		if err != nil {
			return err
		}
		wc, err = s.workoutCycleRepo.UpdateReturning(ctx, userId, planId, id, map[string]any{"completed": completed, "skipped": skipped})
		if err != nil {
			return err
		}

		if !wc.Completed {
			return nil
		}

		if wp.CurrentCycleID != nil && *wp.CurrentCycleID == wc.ID {
			newCycle := &workout.WorkoutCycle{
				WorkoutPlanID:   wp.ID,
				WeekNumber:      wc.WeekNumber + 1,
				Name:            fmt.Sprintf("Week #%d", wc.WeekNumber+1),
				PreviousCycleID: &wc.ID,
			}

			if err := s.workoutCycleRepo.Create(ctx, userId, wp.ID, newCycle); err != nil {
				return err
			}

			if err := s.workoutCycleRepo.Update(ctx, userId, planId, wc.ID, map[string]any{"next_cycle_id": newCycle.ID}); err != nil {
				return err
			}

			wc.NextCycleID = &newCycle.ID

			if err := s.workoutPlanRepo.Update(ctx, userId, wp.ID, map[string]any{"current_cycle_id": newCycle.ID}); err != nil {
				return err
			}
		}

		return nil
	})
	return wc, err
}

// Order of locks used:
// 1. workout_plans
// 2. workout_cycles
func (s *workoutServiceImpl) DeleteWorkoutCycle(ctx context.Context, userId, planId, id uint) error {
	return s.tx.Do(ctx, func(ctx context.Context) error {
		plan, err := s.workoutPlanRepo.GetByIDForUpdate(ctx, userId, planId)
		if err != nil {
			return err
		}
		cycle, err := s.workoutCycleRepo.GetByIDForUpdate(ctx, userId, planId, id)
		if err != nil {
			return err
		}

		if cycle.PreviousCycleID == nil {
			return fmt.Errorf("cannot delete the first cycle of a workout plan")
		}

		prevID := *cycle.PreviousCycleID
		var nextID uint
		hasNext := cycle.NextCycleID != nil
		if hasNext {
			nextID = *cycle.NextCycleID
		}

		if hasNext {
			// Bridge prev <--> next around the node being deleted.
			if err := s.workoutCycleRepo.Update(ctx, userId, planId, prevID, map[string]any{"next_cycle_id": nextID}); err != nil {
				return err
			}
			if err := s.workoutCycleRepo.Update(ctx, userId, planId, nextID, map[string]any{"previous_cycle_id": &prevID}); err != nil {
				return err
			}

			// If deleting the current cycle, then current -> next.
			if plan.CurrentCycleID != nil && *plan.CurrentCycleID == cycle.ID {
				if err := s.workoutPlanRepo.Update(ctx, userId, plan.ID, map[string]any{
					"current_cycle_id": nextID,
				}); err != nil {
					return err
				}
			}
		} else {
			// Tail deletion:
			// Mark previous cycle incomplete
			if err := s.workoutCycleRepo.Update(ctx, userId, planId, prevID, map[string]any{"completed": false}); err != nil {
				return err
			}

			// Detach prev.next
			if err := s.workoutCycleRepo.Update(ctx, userId, planId, prevID, map[string]any{"next_cycle_id": nil}); err != nil {
				return err
			}

			// If current == deleted tail, move current back to prev.
			if plan.CurrentCycleID != nil && *plan.CurrentCycleID == cycle.ID {
				if err := s.workoutPlanRepo.Update(ctx, userId, plan.ID, map[string]any{
					"current_cycle_id": prevID,
				}); err != nil {
					return err
				}
			}
		}

		for _, w := range cycle.Workouts {
			for _, we := range w.WorkoutExercises {
				if err := s.individualExerciseRepo.RewireLastCompletedWorkoutExercise(ctx, userId, we.ID, we.PreviousExerciseID); err != nil {
					return err
				}
			}
		}

		// Delete the node.
		return s.workoutCycleRepo.Delete(ctx, userId, planId, id)
	})
}

func (s *workoutServiceImpl) GetCurrentWorkoutCycle(ctx context.Context, userId uint) (*workout.WorkoutCycle, error) {
	plans, err := s.workoutPlanRepo.GetByUserID(ctx, userId)
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
		return nil, nil
	}

	if activePlan.CurrentCycleID == nil {
		return nil, nil
	}

	cycle, err := s.workoutCycleRepo.GetByID(ctx, userId, activePlan.ID, *activePlan.CurrentCycleID)
	if err != nil {
		return nil, err
	}

	return cycle, nil
}
