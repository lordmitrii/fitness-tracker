package workout

import (
	"context"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
)

// Order of locks used:
// 1. workout_cycles
// 2. workouts
func (s *workoutServiceImpl) CreateWorkout(ctx context.Context, userId, planId, cycleId uint, w *workout.Workout) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, cycleId); err != nil {
			return err
		}
		maxIndex, err := s.workoutRepo.GetMaxWorkoutIndexByWorkoutCycleID(ctx, userId, planId, cycleId)
		if err != nil {
			return err
		}
		w.Index = maxIndex + 1
		return s.workoutRepo.Create(ctx, userId, planId, cycleId, w)
	})
}

// Order of locks used:
// 1. workout_cycles
// 2. workouts
// 3. individual_exercises
// 4. workout_exercises
// 5. workout_sets
func (s *workoutServiceImpl) CreateMultipleWorkouts(ctx context.Context, userId, planId, id uint, workouts []*workout.Workout) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, id); err != nil {
			return err
		}

		for _, w := range workouts {
			// create workoutExercises first

			w.ID = 0 // Will be set after the workout is created
			w.WorkoutCycleID = id

			for i, we := range w.WorkoutExercises {
				we.Index = i + 1
				we.WorkoutID = 0            // reset ID to 0
				we.IndividualExercise = nil // reset as well

				prevSets, err := s.GetPreviousSets(ctx, userId, we.IndividualExerciseID, we.SetsQt)
				if err != nil {
					return err
				}

				for j := int64(0); j < we.SetsQt; j++ {
					set := &workout.WorkoutSet{
						WorkoutExerciseID: we.ID,
						Index:             int(j) + 1,
						Completed:         false,
					}

					if prevSets != nil && int(j) < len(prevSets) {
						set.PreviousWeight = prevSets[j].PreviousWeight
						set.PreviousReps = prevSets[j].PreviousReps
					}
					we.WorkoutSets = append(we.WorkoutSets, set)
				}
			}

			if err := s.workoutRepo.Create(ctx, userId, planId, id, w); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *workoutServiceImpl) GetWorkoutByID(ctx context.Context, userId, planId, cycleId, id uint) (*workout.Workout, error) {
	return s.workoutRepo.GetByID(ctx, userId, planId, cycleId, id)
}
func (s *workoutServiceImpl) GetWorkoutsByWorkoutCycleID(ctx context.Context, userId, planId, id uint) ([]*workout.Workout, error) {
	return s.workoutRepo.GetByWorkoutCycleID(ctx, userId, planId, id)
}

// 1. workout_cycles
// 2. workouts
func (s *workoutServiceImpl) UpdateWorkout(ctx context.Context, userId, planId, cycleId, id uint, updates map[string]any) (*workout.Workout, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.Workout, error) {
		return s.workoutRepo.UpdateReturning(ctx, userId, planId, cycleId, id, updates)
	})
}

// Order of locks used:
// 1. workout_cycles
// 2. workouts
func (s *workoutServiceImpl) DeleteWorkout(ctx context.Context, userId, planId, cycleId, id uint) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, cycleId); err != nil {
			return err
		}
		workout, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, id)
		if err != nil {
			return err
		}

		workoutCycleID := workout.WorkoutCycleID
		deletedIndex := workout.Index

		if err := s.workoutRepo.Delete(ctx, userId, planId, cycleId, id); err != nil {
			return err
		}

		if err := s.workoutRepo.DecrementIndexesAfterWorkout(ctx, userId, planId, workoutCycleID, deletedIndex); err != nil {
			return err
		}
		return nil
	})
}

// Order of locks used:
// 1. workout_cycles
// 2. workouts
// 3. workout_exercises
func (s *workoutServiceImpl) CompleteWorkout(ctx context.Context, userId, planId, cycleId, id uint, completed, skipped bool) (*workout.Workout, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.Workout, error) {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, cycleId); err != nil {
			return nil, err
		}

		w, err := s.workoutRepo.UpdateReturning(ctx, userId, planId, cycleId, id, map[string]any{
			"completed": completed, "skipped": skipped,
		})
		if err != nil {
			return nil, err
		}

		if w.Skipped {
			for _, we := range w.WorkoutExercises {
				if !we.Completed {
					if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, w.ID, we.ID, map[string]any{"skipped": true}); err != nil {
						return nil, err
					}
				}
			}
		}
		return w, nil
	})
}

// Order of locks used:
// 1. workout_cycles
// 2. workouts
func (s *workoutServiceImpl) MoveWorkout(ctx context.Context, userId, planId, cycleID, workoutID uint, direction string) error {
	return uow.DoIfNotInTx(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, cycleID); err != nil {
			return err
		}

		workout, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleID, workoutID)
		if err != nil {
			return err
		}

		if workout.WorkoutCycleID != cycleID {
			return fmt.Errorf("workout %d does not belong to cycle %d", workoutID, cycleID)
		}

		if direction != "up" && direction != "down" {
			return fmt.Errorf("invalid direction: %s", direction)
		}

		var neighborIndex int
		if direction == "up" {
			neighborIndex = workout.Index - 1
		} else {
			neighborIndex = workout.Index + 1
		}
		if neighborIndex < 0 {
			return fmt.Errorf("invalid neighbor index: %d", neighborIndex)
		}

		if err := s.workoutRepo.SwapWorkoutsByIndex(ctx, userId, planId, workout.WorkoutCycleID, workout.Index, neighborIndex); err != nil {
			return err
		}

		return nil
	})
}
