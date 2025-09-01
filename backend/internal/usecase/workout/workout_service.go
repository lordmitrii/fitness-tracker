package workout

import (
	"context"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *workoutServiceImpl) CreateWorkout(ctx context.Context, w *workout.Workout) error {
	maxIndex, err := s.workoutRepo.GetMaxWorkoutIndexByWorkoutCycleID(ctx, w.WorkoutCycleID)
	if err != nil {
		return err
	}

	w.Index = maxIndex + 1

	return s.workoutRepo.Create(ctx, w)
}

func (s *workoutServiceImpl) CreateMultipleWorkouts(ctx context.Context, cycleID uint, workouts []*workout.Workout) error {
	for _, w := range workouts {
		// create workoutExercises first

		w.ID = 0 // Will be set after the workout is created
		w.WorkoutCycleID = cycleID

		for i, we := range w.WorkoutExercises {
			we.Index = i + 1
			we.WorkoutID = 0            // reset ID to 0
			we.IndividualExercise = nil // reset as well

			prevSets, err := s.GetPreviousSets(ctx, we.IndividualExerciseID, we.SetsQt)
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

		if err := s.workoutRepo.Create(ctx, w); err != nil {
			return err
		}
	}
	return nil
}

func (s *workoutServiceImpl) GetWorkoutByID(ctx context.Context, id uint) (*workout.Workout, error) {
	return s.workoutRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutsByWorkoutCycleID(ctx context.Context, workoutPlanID uint) ([]*workout.Workout, error) {
	return s.workoutRepo.GetByWorkoutCycleID(ctx, workoutPlanID)
}
func (s *workoutServiceImpl) UpdateWorkout(ctx context.Context, id uint, updates map[string]any) (*workout.Workout, error) {
	return s.workoutRepo.UpdateReturning(ctx, id, updates)
}

func (s *workoutServiceImpl) DeleteWorkout(ctx context.Context, id uint) error {
	workout, err := s.workoutRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	workoutCycleID := workout.WorkoutCycleID
	deletedIndex := workout.Index

	if err := s.workoutRepo.Delete(ctx, id); err != nil {
		return err
	}

	if err := s.workoutRepo.DecrementIndexesAfterWorkout(ctx, workoutCycleID, deletedIndex); err != nil {
		return err
	}
	return nil
}

func (s *workoutServiceImpl) CompleteWorkout(ctx context.Context, id uint, completed, skipped bool) (*workout.Workout, error) {
	w, err := s.workoutRepo.UpdateReturning(ctx, id, map[string]any{"completed": completed, "skipped": skipped})
	if err != nil {
		return nil, err
	}

	// Update incompleted exercises to skipped
	if w.Skipped {
		for _, we := range w.WorkoutExercises {
			if !we.Completed {
				if err := s.workoutExerciseRepo.Update(ctx, we.ID, map[string]any{"skipped": true}); err != nil {
					return nil, err
				}
			}
		}
	}

	return w, nil
}

func (s *workoutServiceImpl) MoveWorkout(ctx context.Context, workoutID, cycleID uint, direction string) error {
	workout, err := s.workoutRepo.GetByID(ctx, workoutID)
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

	if err := s.workoutRepo.SwapWorkoutsByIndex(ctx, workout.WorkoutCycleID, workout.Index, neighborIndex); err != nil {
		return err
	}

	return nil
}
