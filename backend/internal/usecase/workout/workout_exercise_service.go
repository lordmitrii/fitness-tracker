package workout

import (
	"context"
	"fmt"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. individual_exercises
// 4. workout_sets
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId uint, e *workout.WorkoutExercise) error {
	return s.tx.Do(ctx, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId); err != nil {
			return err
		}
		maxIndex, err := s.workoutExerciseRepo.GetMaxIndexByWorkoutID(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		if e.Index <= 0 {
			e.Index = maxIndex + 1
		} else {
			if err := s.workoutExerciseRepo.IncrementIndexesAfter(ctx, userId, planId, cycleId, workoutId, e.Index); err != nil {
				return err
			}
		}

		if e.SetsQt <= 0 {
			return fmt.Errorf("sets quantity must be greater than 0")
		}

		if e.SetsQt > 20 {
			return fmt.Errorf("sets quantity must not exceed 20")
		}

		prevSets, err := s.GetPreviousSets(ctx, userId, e.IndividualExerciseID, e.SetsQt)
		if err != nil {
			return err
		}

		for i := int64(0); i < e.SetsQt; i++ {
			set := &workout.WorkoutSet{
				WorkoutExerciseID: e.ID,
				Index:             int(i) + 1,
				Completed:         false,
			}
			if prevSets != nil && int(i) < len(prevSets) {
				set.PreviousWeight = prevSets[i].PreviousWeight
				set.PreviousReps = prevSets[i].PreviousReps
			}
			e.WorkoutSets = append(e.WorkoutSets, set)
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, e.WorkoutID, map[string]any{"completed": false}); err != nil {
			return err
		}

		return s.workoutExerciseRepo.Create(ctx, userId, planId, cycleId, workoutId, e)
	})
}

func (s *workoutServiceImpl) GetWorkoutExerciseByID(ctx context.Context, userId, planId, cycleId, workoutId, id uint) (*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByID(ctx, userId, planId, cycleId, workoutId, id)
}
func (s *workoutServiceImpl) GetWorkoutExercisesByWorkoutID(ctx context.Context, userId, planId, cycleId, workoutId uint) ([]*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByWorkoutID(ctx, userId, planId, cycleId, workoutId)
}

// Order of locks used:
// 1. workout_exercises
func (s *workoutServiceImpl) UpdateWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId, id uint, updates map[string]any) (*workout.WorkoutExercise, error) {
	var we *workout.WorkoutExercise
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutExerciseRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, id, updates)
		if err != nil {
			return err
		}
		we = res
		return nil
	})
	return we, err
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
func (s *workoutServiceImpl) CompleteWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutId, id uint, completed, skipped bool) (*workout.WorkoutExercise, float64, error) {

	acc := &usecase.EventAccumulator{}
	now := time.Now()
	var resKcal float64
	var resWe *workout.WorkoutExercise

	if completed {
		skipped = false
	} else if skipped {
		completed = false
	}

	err := s.tx.Do(ctx, func(ctx context.Context) error {
		wk, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, id); err != nil {
			return err
		}

		switch {
		case completed:
			if err := s.workoutSetRepo.MarkAllSetsCompleted(ctx, userId, planId, cycleId, workoutId, id); err != nil {
				return err
			}

		case skipped:
			if err := s.workoutSetRepo.MarkAllPendingSetsSkipped(ctx, userId, planId, cycleId, workoutId, id); err != nil {
				return err
			}

		default:
			if err := s.workoutSetRepo.MarkAllSetsPending(ctx, userId, planId, cycleId, workoutId, id); err != nil {
				return err
			}
		}

		pendingSets, err := s.workoutSetRepo.GetPendingSetsCount(ctx, userId, planId, cycleId, workoutId, id) // pending = !completed && !skipped
		if err != nil {
			return err
		}

		skippedSets, err := s.workoutSetRepo.GetSkippedSetsCount(ctx, userId, planId, cycleId, workoutId, id)
		if err != nil {
			return err
		}

		totalSets, err := s.workoutSetRepo.GetTotalSetsCount(ctx, userId, planId, cycleId, workoutId, id)
		if err != nil {
			return err
		}

		var weCompleted, weSkipped bool
		if totalSets == 0 {
			weCompleted, weSkipped = false, false
		} else {
			weCompleted = (pendingSets == 0)
			weSkipped = weCompleted && (skippedSets == totalSets)
		}

		we, err := s.workoutExerciseRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, id,
			map[string]any{"completed": weCompleted, "skipped": weSkipped})
		if err != nil {
			return err
		}

		pendingExercises, err := s.workoutExerciseRepo.GetPendingExercisesCount(ctx, userId, planId, cycleId, workoutId) // !completed && !skipped
		if err != nil {
			return err
		}

		skippedExercises, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		totalExercises, err := s.workoutExerciseRepo.GetTotalExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		var wkCompleted, wkSkipped bool
		if totalExercises == 0 {
			wkCompleted, wkSkipped = false, false
		} else {
			wkCompleted = (pendingExercises == 0)
			wkSkipped = wkCompleted && (skippedExercises == totalExercises)
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId,
			map[string]any{"completed": wkCompleted, "skipped": wkSkipped}); err != nil {
			return err
		}

		if wkCompleted {
			wk.Complete(now, userId)
			// resKcal, _, _, _ = s.CalculateWorkoutSummary(ctx, userId, workoutId)
		}

		events := wk.PendingEvents()
		if err := s.dispatcher.Dispatch(ctx, events); err != nil {
			return err
		}

		acc.Add(toAnySlice(events)...)
		wk.ClearPendingEvents()

		wk, err = s.workoutRepo.GetByID(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}
		resKcal = wk.EstimatedCalories
		resWe = we
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	if evs := acc.Drain(); len(evs) > 0 {
		if err := s.bus.Publish(ctx, evs...); err != nil {
			return nil, 0, err
		}
	}

	return resWe, resKcal, nil
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
func (s *workoutServiceImpl) MoveWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, exerciseID uint, direction string) error {
	return s.tx.DoIfNotInTx(ctx, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutID); err != nil {
			return err
		}

		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutID, exerciseID)
		if err != nil {
			return err
		}

		if workoutExercise.WorkoutID != workoutID {
			return fmt.Errorf("workout exercise %d does not belong to workout %d", exerciseID, workoutID)
		}

		if direction != "up" && direction != "down" {
			return fmt.Errorf("invalid direction: %s", direction)
		}

		var neighborIndex int
		if direction == "up" {
			neighborIndex = workoutExercise.Index - 1
		} else {
			neighborIndex = workoutExercise.Index + 1
		}
		if neighborIndex < 0 {
			return fmt.Errorf("cannot move exercise further %s", direction)
		}

		if err := s.workoutExerciseRepo.SwapWorkoutExercisesByIndex(ctx, userId, planId, cycleId, workoutID, workoutExercise.Index, neighborIndex); err != nil {
			return err
		}

		return nil
	})
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. individual_exercises
// 4. workout_sets
func (s *workoutServiceImpl) ReplaceWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, exerciseID, individualExerciseID uint, sets int64) (*workout.WorkoutExercise, error) {
	var res *workout.WorkoutExercise
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		if sets <= 0 {
			return fmt.Errorf("sets quantity must be greater than 0")
		}

		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutID); err != nil {
			return err
		}

		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutID, exerciseID)
		if err != nil {
			return err
		}

		if workoutExercise.WorkoutID != workoutID {
			return fmt.Errorf("workout exercise %d does not belong to workout %d", exerciseID, workoutID)
		}

		if err := s.workoutExerciseRepo.Delete(ctx, userId, planId, cycleId, workoutID, exerciseID); err != nil {
			return err
		}

		newExercise := &workout.WorkoutExercise{
			WorkoutID:            workoutID,
			IndividualExerciseID: individualExerciseID,
			Index:                workoutExercise.Index,
			Completed:            false,
			WorkoutSets:          make([]*workout.WorkoutSet, 0, sets),
		}

		prevSets, err := s.GetPreviousSets(ctx, userId, individualExerciseID, sets)
		if err != nil {
			return err
		}

		for i := range sets {
			set := &workout.WorkoutSet{
				WorkoutExerciseID: newExercise.ID,
				Index:             int(i) + 1,
				Completed:         false,
			}

			if prevSets != nil && int(i) < len(prevSets) {
				set.PreviousWeight = prevSets[i].PreviousWeight
				set.PreviousReps = prevSets[i].PreviousReps
			}

			newExercise.WorkoutSets = append(newExercise.WorkoutSets, set)
		}

		if err := s.workoutExerciseRepo.Create(ctx, userId, planId, cycleId, workoutID, newExercise); err != nil {
			return err
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutExercise.WorkoutID, map[string]any{"completed": false}); err != nil {
			return err
		}

		res = newExercise
		return nil
	})
	return res, err
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. individual_exercises
func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, userId, planId, cycleId, workoutID, id uint) (float64, error) {
	acc := &usecase.EventAccumulator{}
	now := time.Now()
	var resKcal float64
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		workout, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutID)
		if err != nil {
			return err
		}
		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutID, id)
		if err != nil {
			return err
		}

		if err := s.individualExerciseRepo.RewireLastCompletedWorkoutExercise(ctx, userId, workoutExercise.ID, workoutExercise.PreviousExerciseID); err != nil {
			return err
		}

		if err := s.workoutExerciseRepo.Delete(ctx, userId, planId, cycleId, workoutID, id); err != nil {
			return err
		}

		if err := s.workoutExerciseRepo.DecrementIndexesAfter(ctx, userId, planId, cycleId, workoutID, workoutExercise.Index); err != nil {
			return err
		}

		pendingExercises, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutID)
		if err != nil {
			return err
		}

		skippedExercises, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutID)
		if err != nil {
			return err
		}

		totalExercises, err := s.workoutExerciseRepo.GetTotalExercisesCount(ctx, userId, planId, cycleId, workoutID)
		if err != nil {
			return err
		}

		var wkCompleted, wkSkipped bool
		if totalExercises == 0 {
			wkCompleted, wkSkipped = false, false
		} else {
			wkCompleted = (pendingExercises == 0)
			wkSkipped = wkCompleted && (skippedExercises == totalExercises)
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutID, map[string]any{"completed": wkCompleted, "skipped": wkSkipped}); err != nil {
			return err
		}
		if wkCompleted {
			workout.Complete(now, userId)
			// resKcal, _, _, _ = s.CalculateWorkoutSummary(ctx, userId, workoutID)
		}

		events := workout.PendingEvents()
		if err := s.dispatcher.Dispatch(ctx, events); err != nil {
			return err
		}
		acc.Add(toAnySlice(events)...)
		workout.ClearPendingEvents()

		workout, err = s.workoutRepo.GetByID(ctx, userId, planId, cycleId, workoutID)
		if err != nil {
			return err
		}
		resKcal = workout.EstimatedCalories

		return nil
	})

	if err != nil {
		return 0, err
	}

	if evs := acc.Drain(); len(evs) > 0 {
		if err := s.bus.Publish(ctx, evs...); err != nil {
			return 0, err
		}
	}

	return resKcal, nil
}
