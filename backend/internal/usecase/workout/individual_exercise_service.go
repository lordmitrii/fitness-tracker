package workout

import (
	"context"
	"fmt"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *workoutServiceImpl) GetIndividualExercisesByUserID(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error) {
	return s.individualExerciseRepo.GetByUserID(ctx, userID)
}

// This function has 4 cases:
// GET
// 1. If exerciseID is provided and individual exercise already exists, it returns the existing one.
// 2. If exerciseID is not provided (0) and individual exercise already exists, it returns the existing one with name and muscle group from the post request.

// CREATE
// 3. If the individual exercise does not exist and there's a provided exerciseID, it creates a new individual exercise with linked exercise and puts name and muscle group from related exerciseID.
// 4. If the individual exercise does not exist and there's no provided exerciseID, it just creates a new individual exercise without linking it to an exercise and puts name and muscle group from post request.

// Input format will be the folllowing:

// Case 1: Existing Individual Exercise     Case 2: New Individual Exercise with ExerciseID
// {                                        {
//   "user_id": 1,                            "user_id": 1,
//   "exercise_id": 2,                        "exercise_id": 0,  (not provided)
//   "name": "",                              "name": "Bench Press",
//   "muscle_group_id": "",                      "muscle_group": "Chest",
// }                                          }

func (s *workoutServiceImpl) GetOrCreateIndividualExercise(ctx context.Context, userId uint, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error) {
	var result *workout.IndividualExercise
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		if individualExercise.ExerciseID != nil {
			existingIndividualExercise, err := s.individualExerciseRepo.GetByUserAndExerciseID(ctx, userId, *individualExercise.ExerciseID)
			if err == nil {
				result = existingIndividualExercise
				return nil
			}
			if err != custom_err.ErrIndividualExerciseNotFound {
				return err
			}

			exercise, err := s.exerciseRepo.GetByID(ctx, *individualExercise.ExerciseID)
			if err != nil {
				return err
			}

			individualExercise.Name = exercise.Name
			individualExercise.MuscleGroupID = exercise.MuscleGroupID
			if err := s.individualExerciseRepo.Create(ctx, userId, individualExercise); err != nil {
				return err
			}
			result = individualExercise
			return nil
		}

		existingIndividualExercise, err := s.individualExerciseRepo.GetByNameMuscleGroupAndUser(ctx, userId, individualExercise.Name, individualExercise.MuscleGroupID)
		if err == nil {
			result = existingIndividualExercise
			return nil
		}
		if err != custom_err.ErrIndividualExerciseNotFound {
			return err
		}

		if individualExercise.Name == "" || individualExercise.MuscleGroupID == nil {
			return fmt.Errorf("name and muscle group must be provided for creating a new individual exercise if exerciseID is not provided")
		}

		if err := s.individualExerciseRepo.Create(ctx, userId, individualExercise); err != nil {
			return err
		}
		result = individualExercise
		return nil
	})
	return result, err
}

func (s *workoutServiceImpl) GetIndividualExerciseStats(ctx context.Context, userId uint) ([]*workout.IndividualExercise, error) {
	individualExercise, err := s.individualExerciseRepo.GetByUserID(ctx, userId)
	if err != nil {
		return nil, err
	}
	if len(individualExercise) == 0 {
		return individualExercise, nil
	}

	ids := make([]uint, 0, len(individualExercise))
	for _, ie := range individualExercise {
		ids = append(ids, ie.ID)
	}

	bestPerformances, err := s.workoutExerciseRepo.GetBestPerformanceByIndividualExerciseIDs(ctx, userId, ids)
	if err != nil {
		return nil, err
	}

	for _, ie := range individualExercise {
		if perf, ok := bestPerformances[ie.ID]; ok && perf != nil {
			if perf.Weight != nil {
				ie.CurrentWeight = *perf.Weight
			}
			if perf.Reps != nil {
				ie.CurrentReps = *perf.Reps
			}
		}
	}

	return individualExercise, nil

}

func (s *workoutServiceImpl) GetIndividualExercisePerformanceHistory(ctx context.Context, userId, individualExerciseID uint) ([]*workout.ExercisePerformance, error) {
	return s.workoutExerciseRepo.GetSessionPerformancesByIndividualExerciseID(ctx, userId, individualExerciseID)
}
