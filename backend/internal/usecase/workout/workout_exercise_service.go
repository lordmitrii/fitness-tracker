package workout

import (
	"context"
	"fmt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
)

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. individual_exercises
// 4. workout_sets
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, e.WorkoutID); err != nil {
			return err
		}
		maxIndex, err := s.workoutExerciseRepo.GetMaxIndexByWorkoutID(ctx, e.WorkoutID)
		if err != nil {
			return err
		}

		if e.Index <= 0 {
			e.Index = maxIndex + 1
		} else {
			if err := s.workoutExerciseRepo.IncrementIndexesAfter(ctx, e.WorkoutID, e.Index); err != nil {
				return err
			}
		}

		if e.SetsQt <= 0 {
			return fmt.Errorf("sets quantity must be greater than 0")
		}

		if e.SetsQt > 20 {
			return fmt.Errorf("sets quantity must not exceed 20")
		}

		prevSets, err := s.GetPreviousSets(ctx, e.IndividualExerciseID, e.SetsQt)
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

		if err := s.workoutRepo.Update(ctx, e.WorkoutID, map[string]any{"completed": false}); err != nil {
			return err
		}

		return s.workoutExerciseRepo.Create(ctx, e)
	})
}

func (s *workoutServiceImpl) GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByWorkoutID(ctx, workoutID)
}

// Order of locks used:
// 1. workout_exercises
func (s *workoutServiceImpl) UpdateWorkoutExercise(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutExercise, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutExercise, error) {
		return s.workoutExerciseRepo.UpdateReturning(ctx, id, updates)
	})
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. workout_sets
func (s *workoutServiceImpl) CompleteWorkoutExercise(ctx context.Context, workoutId, id uint, completed, skipped bool) (*workout.WorkoutExercise, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutExercise, error) {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, workoutId); err != nil {
			return nil, err
		}
		we, err := s.workoutExerciseRepo.UpdateReturning(ctx, id, map[string]any{"completed": completed, "skipped": skipped})
		if err != nil {
			return nil, err
		}

		if we.Skipped {
			for _, set := range we.WorkoutSets {
				if !set.Completed {
					if err := s.workoutSetRepo.Update(ctx, set.ID, map[string]any{"skipped": true}); err != nil {
						return nil, err
					}
				}
			}
		}

		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, we.WorkoutID)
		if err != nil {
			return nil, err
		}

		if err := s.workoutRepo.Update(ctx, workoutId, map[string]any{"completed": incompletedExercisesCount == 0}); err != nil {
			return nil, err
		}

		return we, nil
	})
}

// Order of locks used:
// 1. workouts
// 2. workout_exercises
func (s *workoutServiceImpl) MoveWorkoutExercise(ctx context.Context, workoutID, exerciseID uint, direction string) error {
	return uow.DoIfNotInTx(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, workoutID); err != nil {
			return err
		}

		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, exerciseID)
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

		if err := s.workoutExerciseRepo.SwapWorkoutExercisesByIndex(ctx, workoutID, workoutExercise.Index, neighborIndex); err != nil {
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
func (s *workoutServiceImpl) ReplaceWorkoutExercise(ctx context.Context, workoutID, exerciseID, individualExerciseID uint, sets int64) (*workout.WorkoutExercise, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutExercise, error) {
		if sets <= 0 {
			return nil, fmt.Errorf("sets quantity must be greater than 0")
		}

		if err := s.workoutRepo.LockByIDForUpdate(ctx, workoutID); err != nil {
			return nil, err
		}

		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, exerciseID)
		if err != nil {
			return nil, err
		}

		if workoutExercise.WorkoutID != workoutID {
			return nil, fmt.Errorf("workout exercise %d does not belong to workout %d", exerciseID, workoutID)
		}

		if err := s.workoutExerciseRepo.Delete(ctx, exerciseID); err != nil {
			return nil, err
		}

		newExercise := &workout.WorkoutExercise{
			WorkoutID:            workoutID,
			IndividualExerciseID: individualExerciseID,
			Index:                workoutExercise.Index,
			Completed:            false,
			WorkoutSets:          make([]*workout.WorkoutSet, 0, sets),
		}

		prevSets, err := s.GetPreviousSets(ctx, individualExerciseID, sets)
		if err != nil {
			return nil, err
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

		if err := s.workoutExerciseRepo.Create(ctx, newExercise); err != nil {
			return nil, err
		}

		if err := s.workoutRepo.Update(ctx, workoutExercise.WorkoutID, map[string]any{"completed": false}); err != nil {
			return nil, err
		}

		return newExercise, nil
	})
}
// Order of locks used:
// 1. workouts
// 2. workout_exercises
// 3. individual_exercises
func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, workoutID, id uint) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		if err := s.workoutRepo.LockByIDForUpdate(ctx, workoutID); err != nil {
			return err
		}
		workoutExercise, err := s.workoutExerciseRepo.GetByIDForUpdate(ctx, id)
		if err != nil {
			return err
		}

		if workoutExercise.PreviousExerciseID != nil {
			if err := s.individualExerciseRepo.Update(ctx, workoutExercise.IndividualExerciseID, map[string]any{"last_completed_workout_exercise_id": workoutExercise.PreviousExerciseID}); err != nil {
				return err
			}
		}

		if err := s.workoutExerciseRepo.Delete(ctx, id); err != nil {
			return err
		}

		if err := s.workoutExerciseRepo.DecrementIndexesAfter(ctx, workoutID, workoutExercise.Index); err != nil {
			return err
		}

		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, workoutID)
		if err != nil {
			return err
		}

		if err := s.workoutRepo.Update(ctx, workoutID, map[string]any{"completed": incompletedExercisesCount == 0}); err != nil {
			return err
		}

		return nil
	})
}
