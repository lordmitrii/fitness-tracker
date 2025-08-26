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

	we, err := s.workoutExerciseRepo.GetByID(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	we.Completed = false
	if err := s.workoutExerciseRepo.Complete(ctx, we); err != nil {
		return err
	}

	w, err := s.workoutRepo.GetByID(ctx, we.WorkoutID)
	if err != nil {
		return err
	}

	w.Completed = false
	if err := s.workoutRepo.Complete(ctx, w); err != nil {
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

func (s *workoutServiceImpl) UpdateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error {
	we, err := s.workoutExerciseRepo.GetByID(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	// Set workout and exercise to incomplete and unskipped if changing values of sets
	if we.Completed || we.Skipped {
		we.Completed = false
		we.Skipped = false
		s.workoutExerciseRepo.Complete(ctx, we)

		w, err := s.workoutRepo.GetByID(ctx, we.WorkoutID)
		if err != nil {
			return err
		}
		if w.Completed || w.Skipped {
			w.Completed = false
			w.Skipped = false
			s.workoutRepo.Complete(ctx, w)
		}
	}

	return s.workoutSetRepo.Update(ctx, ws)
}

func (s *workoutServiceImpl) CompleteWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error {
	err := s.workoutSetRepo.Complete(ctx, ws)
	if err != nil {
		return err
	}

	we, err := s.workoutExerciseRepo.GetByID(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, we.ID)
	if err != nil {
		return err
	}

	we.Completed = incompletedSetsCount == 0
	err = s.workoutExerciseRepo.Complete(ctx, we)
	if err != nil {
		return err
	}
	//same here

	w, err := s.workoutRepo.GetByID(ctx, we.WorkoutID)
	if err != nil {
		return err
	}

	incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, w.ID)
	if err != nil {
		return err
	}

	skippedExercisesCount, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, w.ID)
	if err != nil {
		return err
	}

	w.Completed = incompletedExercisesCount-skippedExercisesCount == 0
	err = s.workoutRepo.Complete(ctx, w)
	if err != nil {
		return err
	}

	w.Skipped = skippedExercisesCount == 0
	// set skipped if all are skipped

	ie, err := s.individualExerciseRepo.GetByID(ctx, we.IndividualExerciseID)
	if err != nil {
		return err
	}

	if ie.LastCompletedWorkoutExerciseID != nil {
		we.PreviousExerciseID = ie.LastCompletedWorkoutExerciseID
		if err := s.workoutExerciseRepo.Update(ctx, we); err != nil {
			return err
		}
	}

	if ws.Completed {
		ie.LastCompletedWorkoutExerciseID = &we.ID
		if err := s.individualExerciseRepo.Update(ctx, ie); err != nil {
			return err
		}
	}

	return nil
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
	workoutSet, err := s.workoutSetRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	workoutExerciseID := workoutSet.WorkoutExerciseID
	deletedIndex := workoutSet.Index

	if err := s.workoutSetRepo.Delete(ctx, id); err != nil {
		return err
	}

	if err := s.workoutSetRepo.DecrementIndexesAfter(ctx, workoutExerciseID, deletedIndex); err != nil {
		return err
	}

	we, err := s.workoutExerciseRepo.GetByID(ctx, workoutExerciseID)
	if err != nil {
		return err
	}

	var completed bool
	if len(we.WorkoutSets) == 0 {
		completed = false
	} else {
		incompletedSetsCount, err := s.workoutSetRepo.GetIncompleteSetsCount(ctx, workoutExerciseID)
		if err != nil {
			return err
		}
		completed = incompletedSetsCount == 0
	}
	we.Completed = completed
	if err := s.workoutExerciseRepo.Complete(ctx, we); err != nil {
		return err
	}

	w, err := s.workoutRepo.GetByID(ctx, we.WorkoutID)
	if err != nil {
		return err
	}

	var workoutCompleted bool
	if len(w.WorkoutExercises) == 0 {
		workoutCompleted = false
	} else {
		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx,
			w.ID)
		if err != nil {
			return err
		}
		workoutCompleted = incompletedExercisesCount == 0
	}
	w.Completed = workoutCompleted
	if err := s.workoutRepo.Complete(ctx, w); err != nil {
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
