package workout

import (
	"context"
	"fmt"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
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

func (s *workoutServiceImpl) GetOrCreateIndividualExercise(ctx context.Context, individualExercise *workout.IndividualExercise) (*workout.IndividualExercise, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.IndividualExercise, error) {
		// Case 1 & 3: exerciseID is provided
		if individualExercise.ExerciseID != nil {
			existingIndividualExercise, err := s.individualExerciseRepo.GetByUserAndExerciseID(ctx, individualExercise.UserID, *individualExercise.ExerciseID)
			if err == nil {
				// Case 1: Found existing individual exercise
				return existingIndividualExercise, nil
			}
			if err != custom_err.ErrIndividualExerciseNotFound {
				return nil, err
			}

			// Case 3: Not found, create a new individual exercise with linked exercise
			exercise, err := s.exerciseRepo.GetByID(ctx, *individualExercise.ExerciseID)
			if err != nil {
				return nil, err
			}

			// Set the name and muscle group from the exercise
			individualExercise.Name = exercise.Name
			individualExercise.MuscleGroupID = exercise.MuscleGroupID
			if err := s.individualExerciseRepo.Create(ctx, individualExercise); err != nil {
				return nil, err
			}
			return individualExercise, nil
		}

		// Case 2 & 4: exerciseID is not provided (0)
		existingIndividualExercise, err := s.individualExerciseRepo.GetByNameMuscleGroupAndUser(ctx, individualExercise.Name, individualExercise.MuscleGroupID, individualExercise.UserID)
		if err == nil {
			// Case 2: Found existing individual exercise
			return existingIndividualExercise, nil
		}
		if err != custom_err.ErrIndividualExerciseNotFound {
			return nil, err
		}

		if individualExercise.Name == "" || individualExercise.MuscleGroupID == nil {
			return nil, fmt.Errorf("name and muscle group must be provided for creating a new individual exercise if exerciseID is not provided")
		}

		// Case 4: Not found, create a new individual exercise without linking it to an exercise
		if err := s.individualExerciseRepo.Create(ctx, individualExercise); err != nil {
			return nil, err
		}
		return individualExercise, nil
	})
}

func (s *workoutServiceImpl) GetIndividualExerciseStats(ctx context.Context, userID uint) ([]*workout.IndividualExercise, error) {
	individualExercise, err := s.individualExerciseRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(individualExercise) == 0 {
		return individualExercise, nil
	}

	for _, ie := range individualExercise {
		last5WorkoutExercises, err := s.workoutExerciseRepo.GetLast5ByIndividualExerciseID(ctx, ie.ID)
		if err != nil {
			return nil, err
		}
		if len(last5WorkoutExercises) == 0 {
			continue
		}

		bestWeight := 0
		bestReps := 0

		for _, we := range last5WorkoutExercises {
			for _, ws := range we.WorkoutSets {
				if ws.Weight == nil || ws.Reps == nil {
					continue
				}
				if *ws.Weight*(*ws.Reps) > bestWeight*bestReps {
					bestWeight = *ws.Weight
					bestReps = *ws.Reps
				}
			}
		}

		ie.CurrentWeight = bestWeight
		ie.CurrentReps = bestReps
	}
	// Find best weight and reps for each individual exercise in the
	return individualExercise, nil

}
