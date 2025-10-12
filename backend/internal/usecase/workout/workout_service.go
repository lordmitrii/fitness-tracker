package workout

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
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

		for _, we := range workout.WorkoutExercises {
			if err := s.individualExerciseRepo.RewireLastCompletedWorkoutExercise(ctx, userId, we.ID, we.PreviousExerciseID); err != nil {
				return err
			}
		}

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
func (s *workoutServiceImpl) CompleteWorkout(ctx context.Context, userId, planId, cycleId, id uint, completed, skipped bool) (*workout.Workout, float64, error) {
	acc := &uow.EventAccumulator{}
	now := time.Now()
	var resKcal float64
	if completed {
		skipped = false
	} else if skipped {
		completed = false
	}
	resWorkout, err := uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.Workout, error) {
		if err := s.workoutCycleRepo.LockByIDForUpdate(ctx, userId, planId, cycleId); err != nil {
			return nil, err
		}

		w, err := s.workoutRepo.GetByIDForUpdate(ctx, userId, planId, cycleId, id)
		if err != nil {
			return nil, err
		}

		switch {
		case completed:
			if err := s.workoutExerciseRepo.MarkAllExercisesCompleted(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
			// Mark all sets completed, not skipped
			if err := s.workoutSetRepo.MarkAllSetsCompletedByWorkoutID(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
		case skipped:
			if err := s.workoutExerciseRepo.MarkAllPendingExercisesSkipped(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
			// Mark all *pending* sets skipped (don’t touch completed ones)
			if err := s.workoutSetRepo.MarkAllPendingSetsSkippedByWorkoutID(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
		default:
			if err := s.workoutExerciseRepo.MarkAllExercisesPending(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
			if err := s.workoutSetRepo.MarkAllSetsPendingByWorkoutID(ctx, userId, planId, cycleId, id); err != nil {
				return nil, err
			}
		}

		pendingExercises, err := s.workoutExerciseRepo.GetPendingExercisesCount(ctx, userId, planId, cycleId, id)
		if err != nil {
			return nil, err
		}
		skippedExercises, err := s.workoutExerciseRepo.GetSkippedExercisesCount(ctx, userId, planId, cycleId, id)
		if err != nil {
			return nil, err
		}
		totalExercises, err := s.workoutExerciseRepo.GetTotalExercisesCount(ctx, userId, planId, cycleId, id)
		if err != nil {
			return nil, err
		}

		var wkCompleted, wkSkipped bool
		if totalExercises == 0 {
			// Empty workout stays pending for consistency with delete flows
			wkCompleted, wkSkipped = false, false
		} else {
			wkCompleted = (pendingExercises == 0)
			wkSkipped = wkCompleted && (skippedExercises == totalExercises)
		}

		if wkCompleted {
			w.Complete(now, userId)
			resKcal, _, _, _ = s.CalculateWorkoutSummary(ctx, userId, w.ID)
		} else if wkSkipped {
			w.MarkSkipped()
		} else {
			w.Completed = false
			w.Skipped = false
		}

		if err := s.workoutRepo.Update(ctx, userId, planId, cycleId, id,
			map[string]any{"completed": w.Completed, "skipped": w.Skipped}); err != nil {
			return nil, err
		}

		acc.Add(toAnySlice(w.PendingEvents())...)
		w.ClearPendingEvents()

		w, err = s.workoutRepo.GetByID(ctx, userId, planId, cycleId, id)
		if err != nil {
			return nil, err
		}

		return w, nil
	})
	if err != nil {
		return nil, 0, err
	}

	if evs := acc.Drain(); len(evs) > 0 {
		if err := s.bus.Publish(ctx, evs...); err != nil {
			return nil, 0, err
		}
	}

	return resWorkout, resKcal, nil
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

func (s *workoutServiceImpl) CalculateWorkoutSummary(ctx context.Context, userID, workoutID uint) (float64, float64, float64, error) {
	res, err := uow.DoRIfNotInTx(ctx, s.db, func(ctx context.Context) (map[string]float64, error) {
		profile, err := s.profileRepo.GetByUserID(ctx, userID)
		if err != nil && err != custom_err.ErrProfileNotFound {
			return nil, err
		}
		// fallback defaults
		var (
			userWeightKg float64 = 70
			userAge      int     = 30
			userSex      string  = ""
		)
		if profile != nil {
			if profile.Weight > 0 {
				userWeightKg = float64(profile.Weight) / 1000.0
			}
			userAge = profile.Age
			userSex = strings.ToLower(profile.Sex)
		}

		w, err := s.workoutRepo.GetOnlyByID(ctx, userID, workoutID)
		if err != nil {
			return nil, err
		}
		var totalCalories, totalActiveMin, totalRestMin float64

		for _, we := range w.WorkoutExercises {
			if we == nil || we.Skipped || !we.Completed {
				continue
			}
			ie, err := s.individualExerciseRepo.GetByID(ctx, userID, we.IndividualExerciseID)
			if err != nil {
				if err == custom_err.ErrNotFound {
					continue
				}
				return nil, err
			}

			exCal, _, exActiveMin, exRestMin := s.estimateExerciseEnergy(ie, we, userWeightKg)
			for _, set := range we.WorkoutSets {
				if set == nil {
					continue
				}
			}

			totalCalories += exCal
			totalActiveMin += exActiveMin
			totalRestMin += exRestMin
		}

		totalCalories = adjustCaloriesForUser(totalCalories, userAge, userSex)
		res := map[string]float64{
			"calories":   math.Round(totalCalories*10) / 10.0,
			"active_min": math.Round(totalActiveMin*10) / 10.0,
			"rest_min":   math.Round(totalRestMin*10) / 10.0,
		}

		if err := s.workoutRepo.UpdateOnlyById(ctx, userID, workoutID, map[string]any{
			"estimated_calories":   res["calories"],
			"estimated_active_min": res["active_min"],
			"estimated_rest_min":   res["rest_min"],
		}); err != nil {
			return nil, err
		}
		return res, nil
	})
	if err != nil {
		return 0, 0, 0, err
	}
	return res["calories"], res["active_min"], res["rest_min"], nil
}
