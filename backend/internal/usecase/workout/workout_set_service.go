package workout

import (
	"context"
	"fmt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *workoutServiceImpl) CreateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error {
	maxIndex, err := s.workoutSetRepo.GetMaxIndexByWorkoutExerciseID(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	if ws.Index <= 0 {
		ws.Index = maxIndex + 1
	} else {
		if err := s.workoutSetRepo.IncrementIndexesAfter(ctx, ws.WorkoutExerciseID, ws.Index); err != nil {
			return err
		}
	}

	we, err := s.workoutExerciseRepo.UpdateReturning(ctx, ws.WorkoutExerciseID, map[string]any{"completed": false})
	if err != nil {
		return err
	}

	if err := s.workoutRepo.Update(ctx, we.WorkoutID, map[string]any{"completed": false}); err != nil {
		return err
	}

	return s.workoutSetRepo.Create(ctx, ws)
}

func (s *workoutServiceImpl) GetWorkoutSetByID(ctx context.Context, id uint) (*workout.WorkoutSet, error) {
	return s.workoutSetRepo.GetByID(ctx, id)
}

func (s *workoutServiceImpl) GetWorkoutSetsByWorkoutExerciseID(ctx context.Context, workoutExerciseID uint) ([]*workout.WorkoutSet, error) {
	return s.workoutSetRepo.GetByWorkoutExerciseID(ctx, workoutExerciseID)
}

func (s *workoutServiceImpl) UpdateWorkoutSet(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutSet, error) {
	// Set skipped and completed to false if updating workout set
	updates["skipped"] = false
	updates["completed"] = false

	ws, err := s.workoutSetRepo.UpdateReturning(ctx, id, updates)
	if err != nil {
		return nil, err
	}
	we, err := s.workoutExerciseRepo.UpdateReturning(ctx, ws.WorkoutExerciseID, map[string]any{"completed": false, "skipped": false})
	if err != nil {
		return nil, err
	}

	if err := s.workoutRepo.Update(ctx, we.WorkoutID, map[string]any{"completed": false, "skipped": false}); err != nil {
		return nil, err
	}

	return ws, nil
}

func (s *workoutServiceImpl) CompleteWorkoutSet(ctx context.Context, id uint, completed, skipped bool) (*workout.WorkoutSet, error) {
	ws, err := s.workoutSetRepo.UpdateReturning(ctx, id, map[string]any{"completed": completed, "skipped": skipped})
	if err != nil {
		return nil, err
	}

	incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return nil, err
	}

	we, err := s.workoutExerciseRepo.UpdateReturning(ctx, ws.WorkoutExerciseID, map[string]any{"completed": incompletedSetsCount == 0})
	if err != nil {
		return nil, err
	}

	incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, we.WorkoutID)
	if err != nil {
		return nil, err
	}

	skippedExercisesCount, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, we.WorkoutID)
	if err != nil {
		return nil, err
	}

	if err := s.workoutRepo.Update(ctx, we.WorkoutID, map[string]any{"completed": incompletedExercisesCount-skippedExercisesCount == 0}); err != nil {
		return nil, err
	}

	ie, err := s.individualExerciseRepo.GetByID(ctx, we.IndividualExerciseID)
	if err != nil {
		return nil, err
	}

	if ie.LastCompletedWorkoutExerciseID != nil {
		if err := s.workoutExerciseRepo.Update(ctx, we.ID, map[string]any{"previous_exercise_id": ie.LastCompletedWorkoutExerciseID}); err != nil {
			return nil, err
		}
	}

	if ws.Completed {
		if err := s.individualExerciseRepo.Update(ctx, ie.ID, map[string]any{"last_completed_workout_exercise_id": we.ID}); err != nil {
			return nil, err
		}
	}

	return ws, nil
}

func (s *workoutServiceImpl) MoveWorkoutSet(ctx context.Context, exerciseID, setID uint, direction string) error {
	workoutSet, err := s.workoutSetRepo.GetByID(ctx, setID)
	if err != nil {
		return err
	}

	if workoutSet.WorkoutExerciseID != exerciseID {
		return fmt.Errorf("workout set %d does not belong to workout exercise %d", setID, exerciseID)
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

	if err := s.workoutSetRepo.SwapWorkoutSetsByIndex(ctx, workoutSet.WorkoutExerciseID, workoutSet.Index, neighborIndex); err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) DeleteWorkoutSet(ctx context.Context, id uint) error {
	ws, err := s.workoutSetRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.workoutSetRepo.Delete(ctx, id); err != nil {
		return err
	}

	if err := s.workoutSetRepo.DecrementIndexesAfter(ctx, ws.WorkoutExerciseID, ws.Index); err != nil {
		return err
	}

	incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	we, err := s.workoutExerciseRepo.UpdateReturning(ctx, ws.WorkoutExerciseID, map[string]any{"completed": incompletedSetsCount == 0})
	if err != nil {
		return err
	}

	incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, we.WorkoutID)
	if err != nil {
		return err
	}

	if err := s.workoutRepo.Update(ctx, we.WorkoutID, map[string]any{"completed": incompletedExercisesCount == 0}); err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error) {
	return s.workoutSetRepo.GetIncompleteSetsCount(ctx, workoutExerciseID)
}

func (s *workoutServiceImpl) GetPreviousSets(ctx context.Context, individualExerciseID uint, qt int64) ([]*workout.WorkoutSet, error) {
	ie, err := s.individualExerciseRepo.GetByID(ctx, individualExerciseID)
	if err != nil {
		return nil, err
	}

	if ie.LastCompletedWorkoutExerciseID == nil {
		return nil, nil
	}

	prevWE, err := s.workoutExerciseRepo.GetByID(ctx, *ie.LastCompletedWorkoutExerciseID)
	if err != nil {
		return nil, err
	}
	previousSets, err := s.workoutSetRepo.GetByWorkoutExerciseID(ctx, prevWE.ID)
	if err != nil {
		return nil, err
	}
	if len(previousSets) == 0 {
		return nil, nil
	}

	var prevSets []*workout.WorkoutSet

	for i := int64(0); i < qt; i++ {
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
