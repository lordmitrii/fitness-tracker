package workout

import (
	"context"
	"fmt"
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
func (s *workoutServiceImpl) CompleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint, completed, skipped bool) (*workout.WorkoutSet, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutSet, error) {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId); err != nil {
			return nil, err
		}
		if err := s.workoutExerciseRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId, weId); err != nil {
			return nil, err
		}
		ws, err := s.workoutSetRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, weId, id, map[string]any{"completed": completed, "skipped": skipped})
		if err != nil {
			return nil, err
		}

		incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return nil, err
		}

		we, err := s.workoutExerciseRepo.UpdateReturning(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID, map[string]any{"completed": incompletedSetsCount == 0})
		if err != nil {
			return nil, err
		}

		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		skippedExercisesCount, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return nil, err
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": incompletedExercisesCount-skippedExercisesCount == 0}); err != nil {
			return nil, err
		}

		ie, err := s.individualExerciseRepo.GetByID(ctx, we.IndividualExerciseID)
		if err != nil {
			return nil, err
		}

		if ie.LastCompletedWorkoutExerciseID != nil {
			if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, we.ID, map[string]any{"previous_exercise_id": ie.LastCompletedWorkoutExerciseID}); err != nil {
				return nil, err
			}
		}

		if ws.Completed {
			if err := s.individualExerciseRepo.Update(ctx, ie.ID, map[string]any{"last_completed_workout_exercise_id": we.ID}); err != nil {
				return nil, err
			}
		}

		return ws, nil
	})
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
func (s *workoutServiceImpl) DeleteWorkoutSet(ctx context.Context, userId, planId, cycleId, workoutId, weId, id uint) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, userId, planId, cycleId, workoutId); err != nil {
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

		incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID)
		if err != nil {
			return err
		}

		if err := s.workoutExerciseRepo.Update(ctx, userId, planId, cycleId, workoutId, ws.WorkoutExerciseID, map[string]any{"completed": incompletedSetsCount == 0}); err != nil {
			return err
		}

		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, userId, planId, cycleId, workoutId)
		if err != nil {
			return err
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, workoutId, map[string]any{"completed": incompletedExercisesCount == 0}); err != nil {
			return err
		}

		return nil
	})
}

func (s *workoutServiceImpl) GetIncompleteSetsCount(ctx context.Context, userId, planId, cycleId, workoutId, weId uint) (int64, error) {
	return s.workoutSetRepo.GetIncompleteSetsCount(ctx, userId, planId, cycleId, workoutId, weId)
}

func (s *workoutServiceImpl) GetPreviousSets(ctx context.Context, userId, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error) {
	ie, err := s.individualExerciseRepo.GetByID(ctx, individualExerciseID)
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
