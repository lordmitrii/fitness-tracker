package workout

import (
	"context"
	"fmt"
	"time"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
)

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
func (s *workoutServiceImpl) CreateWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId uint, ws *workout.WorkoutSet) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId); err != nil {
			return err
		}
		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return err
		}
		maxIndex, err := s.workoutSetRepo.GetMaxIndexByWorkoutExerciseID(ctx, userId, planId, cycleId, workoutId, weId)
		if err != nil {
			return err
		}

		if ws.Index <= 0 {
			ws.Index = maxIndex + 1
		} else {
			if err := s.workoutSetRepo.IncrementIndexesAfter(ctx, userId, planId, cycleId, workoutId, weId, ws.Index); err != nil {
				return err
			}
		}

		if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, weId, map[string]any{"completed": false}); err != nil {
			return err
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": false}); err != nil {
			return err
		}

		return s.workoutSetRepo.Create(ctx, userId, planId, cycleId, workoutId, weId, ws)
	})
}

func (s *workoutServiceImpl) GetWorkoutSetByID(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) (*workout.WorkoutSet, error) {
	return s.workoutSetRepo.GetByID(ctx, userId, planId, cycleId, workoutId, weId, id)
}

func (s *workoutServiceImpl) GetWorkoutSetsByWorkoutExerciseID(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) ([]*workout.WorkoutSet, error) {
	return s.workoutSetRepo.GetByWorkoutExerciseID(ctx, userId, planId, cycleId, workoutId, weId)
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
func (s *workoutServiceImpl) UpdateWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, updates map[string]any) (*workout.WorkoutSet, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutSet, error) {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId); err != nil {
			return nil, err
		}
		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return nil, err
		}
		// Set skipped and completed to false if updating workout set
		updates["skipped"] = false
		updates["completed"] = false

		ws, err := s.workoutSetRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, weId, id, updates)
		if err != nil {
			return nil, err
		}
		if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID, map[string]any{"completed": false, "skipped": false}); err != nil {
			return nil, err
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": false, "skipped": false}); err != nil {
			return nil, err
		}

		return ws, nil
	})
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
// 4. individual_exercises
func (s *workoutServiceImpl) CompleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, completed, skipped bool) (*workout.WorkoutSet, float64, error) {
	acc := &uow.EventAccumulator{}
	now := time.Now()
	var resKcal float64

	if completed {
		skipped = false
	} else if skipped {
		completed = false
	}
	resSet, err := uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutSet, error) {
		workout, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return nil, err
		}
		ws, err := s.workoutSetRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, weId, id, map[string]any{"completed": completed, "skipped": skipped})
		if err != nil {
			return nil, err
		}

		pendingSetsCount, err := s.workoutSetRepo.GetPendingSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return nil, err
		}

		skippedSetsCount, err := s.workoutSetRepo.GetSkippedSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return nil, err
		}

		totalSetsCount, err := s.workoutSetRepo.GetTotalSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return nil, err
		}

		weCompleted := pendingSetsCount == 0
		weSkipped := weCompleted && (skippedSetsCount == totalSetsCount)

		we, err := s.workoutExerciseRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID, map[string]any{"completed": weCompleted, "skipped": weSkipped})
		if err != nil {
			return nil, err
		}

		pendingExercisesCount, err := s.workoutExerciseRepo.GetPendingExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		skippedExercisesCount, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		totalExercisesCount, err := s.workoutExerciseRepo.GetTotalExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		wkCompleted := pendingExercisesCount == 0
		wkSkipped := wkCompleted && (skippedExercisesCount == totalExercisesCount)

		if !completed && !skipped {
			wkCompleted = false
			wkSkipped = false
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": wkCompleted, "skipped": wkSkipped}); err != nil {
			return nil, err
		}

		if wkCompleted {
			workout.Complete(now, userId)
			resKcal, _, _, _ = s.CalculateWorkoutSummary(ctx, userId, workoutId)
		}

		ie, err := s.individualExerciseRepo.GetByID(ctx, userId, we.IndividualExerciseID)
		if err != nil {
			return nil, err
		}

		if ie.LastCompletedWorkoutExerciseID != nil {
			if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, we.ID, map[string]any{"previous_exercise_id": ie.LastCompletedWorkoutExerciseID}); err != nil {
				return nil, err
			}
		}

		if ws.Completed {
			if err := s.individualExerciseRepo.Update(ctx, userId, ie.ID, map[string]any{"last_completed_workout_exercise_id": we.ID}); err != nil {
				return nil, err
			}
		}

		acc.Add(toAnySlice(workout.PendingEvents())...)
		workout.ClearPendingEvents()

		return ws, nil
	})
	if err != nil {
		return nil, 0, err
	}

	if evs := acc.Drain(); len(evs) > 0 {
		if err := s.bus.Publish(ctx, evs...); err != nil {
			return nil, 0, err
		}
	}
	return resSet, resKcal, nil
}

// Order of locks used:
// 1. workout_exercises
// 2. workout_sets
func (s *workoutServiceImpl) MoveWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, direction string) error {
	return uow.DoIfNotInTx(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return err
		}

		workoutSet, err := s.workoutSetRepo.GetByID(ctx, userId, planId, cycleId, workoutId, weId, id)
		if err != nil {
			return err
		}

		if workoutSet.WorkoutExerciseID != weId {
			return fmt.Errorf("workout set %d does not belong to workout exercise %d", id, weId)
		}

		if direction != "up" && direction != "down" {
			return fmt.Errorf("invalid direction: %s", direction)
		}

		var neighborIndex int
		if direction == "up" {
			neighborIndex = workoutSet.Index - 1
		} else {
			neighborIndex = workoutSet.Index + 1
		}
		if neighborIndex < 0 {
			return fmt.Errorf("cannot move set further %s", direction)
		}

		if err := s.workoutSetRepo.SwapWorkoutSetsByIndex(ctx, userId, planId, cycleId, workoutId, workoutSet.WorkoutExerciseID, workoutSet.Index, neighborIndex); err != nil {
			return err
		}

		return nil
	})
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
func (s *workoutServiceImpl) DeleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) (float64, error) {
	acc := &uow.EventAccumulator{}
	now := time.Now()
	var resKcal float64
	err := uow.Do(ctx, s.db, func(ctx context.Context) error {
		workout, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}
		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return err
		}
		ws, err := s.workoutSetRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId, id)
		if err != nil {
			return err
		}

		if err := s.workoutSetRepo.Delete(ctx, userId, planId, cycleId, workoutId, weId, id); err != nil {
			return err
		}

		if err := s.workoutSetRepo.DecrementIndexesAfter(ctx, userId, planId, cycleId, workoutId, weId, ws.Index); err != nil {
			return err
		}

		pendingSetsCount, err := s.workoutSetRepo.GetPendingSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return err
		}

		skippedSetsCount, err := s.workoutSetRepo.GetSkippedSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return err
		}

		totalSetsCount, err := s.workoutSetRepo.GetTotalSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return err
		}

		var weCompleted, weSkipped bool
		if totalSetsCount == 0 {
			weCompleted = false
			weSkipped = false
		} else {
			weCompleted = (pendingSetsCount == 0)
			weSkipped = weCompleted && (skippedSetsCount == totalSetsCount)
		}

		if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID, map[string]any{"completed": weCompleted, "skipped": weSkipped}); err != nil {
			return err
		}

		pendingExercisesCount, err := s.workoutExerciseRepo.GetPendingExercisesCount(ctx, userId, planId, cycleId, workoutId) // must mean (!completed && !skipped)
		if err != nil {
			return err
		}

		skippedExercisesCount, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		totalExercisesCount, err := s.workoutExerciseRepo.GetTotalExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		var wkCompleted, wkSkipped bool
		if totalExercisesCount == 0 {
			wkCompleted = false
			wkSkipped = false
		} else {
			wkCompleted = (pendingExercisesCount == 0)
			wkSkipped = wkCompleted && (skippedExercisesCount == totalExercisesCount)
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": wkCompleted, "skipped": wkSkipped}); err != nil {
			return err
		}
		if wkCompleted {
			workout.Complete(now, userId)
			resKcal, _, _, _ = s.CalculateWorkoutSummary(ctx, userId, workoutId)
		}

		acc.Add(toAnySlice(workout.PendingEvents())...)
		workout.ClearPendingEvents()

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

func (s *workoutServiceImpl) GetIncompleteSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error) {
	return s.workoutSetRepo.GetPendingSetsCount(ctx, userId, planId, cycleId, workoutId, weId)
}

func (s *workoutServiceImpl) GetPreviousSets(ctx context.Context, userId, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error) {
	ie, err := s.individualExerciseRepo.GetByID(ctx, userId, individualExerciseID)
	if err != nil {
		return nil, err
	}

	if ie.LastCompletedWorkoutExerciseID == nil {
		return nil, nil
	}

	prevWE, err := s.workoutExerciseRepo.GetOnlyByID(ctx, userId, *ie.LastCompletedWorkoutExerciseID)
	if err != nil && err != custom_err.ErrNotFound {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	previousSets, err := s.workoutSetRepo.GetOnlyByWorkoutExerciseID(ctx, userId, prevWE.ID)
	if err != nil {
		return nil, err
	}
	if len(previousSets) == 0 {
		return nil, nil
	}

	var prevSets []*workout.WorkoutSet

	for i := range qt {
		pSet := &workout.WorkoutSet{}
		if i < int64(len(previousSets)) {
			pSet.PreviousReps = previousSets[i].Reps
			pSet.PreviousWeight = previousSets[i].Weight
		} else {
			lastSet := previousSets[len(previousSets)-1]
			pSet.PreviousReps = lastSet.Reps
			pSet.PreviousWeight = lastSet.Weight
		}
		prevSets = append(prevSets, pSet)
	}
	return prevSets, nil
}
