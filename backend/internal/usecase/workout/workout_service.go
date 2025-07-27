package workout

import (
	"context"
	"fmt"
	"time"

	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type workoutServiceImpl struct {
	workoutPlanRepo        workout.WorkoutPlanRepository
	workoutCycleRepo       workout.WorkoutCycleRepository
	workoutRepo            workout.WorkoutRepository
	workoutExerciseRepo    workout.WorkoutExerciseRepository
	workoutSetRepo         workout.WorkoutSetRepository
	individualExerciseRepo workout.IndividualExerciseRepository
	exerciseRepo           workout.ExerciseRepository
}

func NewWorkoutService(workoutPlanRepo workout.WorkoutPlanRepository, workoutCycleRepo workout.WorkoutCycleRepository, workoutRepo workout.WorkoutRepository, workoutExerciseRepo workout.WorkoutExerciseRepository, workoutSetRepo workout.WorkoutSetRepository, individualExerciseRepo workout.IndividualExerciseRepository, exerciseRepo workout.ExerciseRepository) *workoutServiceImpl {
	return &workoutServiceImpl{
		workoutPlanRepo:        workoutPlanRepo,
		workoutCycleRepo:       workoutCycleRepo,
		workoutRepo:            workoutRepo,
		workoutExerciseRepo:    workoutExerciseRepo,
		workoutSetRepo:         workoutSetRepo,
		individualExerciseRepo: individualExerciseRepo,
		exerciseRepo:           exerciseRepo,
	}
}

func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	if wp.Active {
		// If the workout plan is active, we need to set other plans to inactive
		plans, err := s.workoutPlanRepo.GetByUserID(ctx, wp.UserID)
		if err != nil {
			return err
		}

		for _, plan := range plans {
			if plan.Active {
				plan.Active = false
				if err := s.workoutPlanRepo.SetActive(ctx, plan); err != nil {
					return err
				}
			}
		}
	}

	// Create the workout plan with the initial cycle
	if err := s.workoutPlanRepo.Create(ctx, wp); err != nil {
		return err
	}

	firstCycle := &workout.WorkoutCycle{
		WorkoutPlanID: wp.ID,
		WeekNumber:    1,
		Name:          "Week #1",
	}

	if err := s.workoutCycleRepo.Create(ctx, firstCycle); err != nil {
		return err
	}

	wp.CurrentCycleID = firstCycle.ID
	if err := s.workoutPlanRepo.Update(ctx, wp); err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, id)

}

func (s *workoutServiceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

func (s *workoutServiceImpl) UpdateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	return s.workoutPlanRepo.Update(ctx, wp)
}

func (s *workoutServiceImpl) DeleteWorkoutPlan(ctx context.Context, id uint) error {
	return s.workoutPlanRepo.Delete(ctx, id)
}

func (s *workoutServiceImpl) SetActiveWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	if wp.Active {
		// If the workout plan is active, we need to set other plans to inactive
		plans, err := s.workoutPlanRepo.GetByUserID(ctx, wp.UserID)
		if err != nil {
			return err
		}
		for _, plan := range plans {
			if plan.Active && plan.ID != wp.ID {
				plan.Active = false
				if err := s.workoutPlanRepo.SetActive(ctx, plan); err != nil {
					return err
				}
			}
		}
	}
	return s.workoutPlanRepo.SetActive(ctx, wp)
}

func (s *workoutServiceImpl) CreateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error {
	return s.workoutCycleRepo.Create(ctx, wc)
}

func (s *workoutServiceImpl) GetWorkoutCycleByID(ctx context.Context, id uint) (*workout.WorkoutCycle, error) {
	cycle, err := s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if len(cycle.Workouts) != 0 || cycle.PreviousCycleID == 0 {
		return cycle, nil
	}

	prevCycle, err := s.workoutCycleRepo.GetByID(ctx, cycle.PreviousCycleID)
	if err != nil {
		return nil, err
	}

	if len(prevCycle.Workouts) == 0 {
		return cycle, nil
	}

	var newWorkouts []*workout.Workout
	for _, w := range prevCycle.Workouts {
		newWorkout := &workout.Workout{
			Name:              w.Name,
			WorkoutCycleID:    cycle.ID,
			Index:             w.Index,
			Date:              time.Now().AddDate(0, 0, w.Index),
			Completed:         false,
			PreviousWorkoutID: w.ID,
		}
		// Copy exercises from the previous workout
		for _, we := range w.WorkoutExercises {
			newExercise := &workout.WorkoutExercise{
				WorkoutID:            newWorkout.ID,
				IndividualExerciseID: we.IndividualExerciseID,
				Index:                we.Index,
				Completed:            false,
			}
			// Copy sets from the previous workout exercise
			for _, ws := range we.WorkoutSets {
				newSet := &workout.WorkoutSet{
					WorkoutExerciseID: newExercise.ID,
					Index:             ws.Index,
					PreviousWeight:    ws.Weight,
					PreviousReps:      ws.Reps,
					Completed:         false,
				}
				newExercise.WorkoutSets = append(newExercise.WorkoutSets, newSet)
			}
			newWorkout.WorkoutExercises = append(newWorkout.WorkoutExercises, newExercise)
		}
		newWorkouts = append(newWorkouts, newWorkout)
	}

	// Save new workouts
	if err := s.workoutRepo.BulkCreate(ctx, newWorkouts); err != nil {
		return nil, err
	}

	// Reload cycle with workouts
	cycle, err = s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return cycle, nil
}

func (s *workoutServiceImpl) GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	return s.workoutCycleRepo.GetByWorkoutPlanID(ctx, workoutPlanID)
}

func (s *workoutServiceImpl) UpdateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error {
	return s.workoutCycleRepo.Update(ctx, wc)
}

func (s *workoutServiceImpl) CompleteWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) (uint, error) {
	if err := s.workoutCycleRepo.Complete(ctx, wc); err != nil {
		return 0, err
	}

	wc, err := s.workoutCycleRepo.GetByID(ctx, wc.ID)
	if err != nil {
		return 0, err
	}

	// If the cycle is completed, we need to create a new cycle for the next week if it is not already created
	if wc.Completed {
		wp, err := s.workoutPlanRepo.GetByID(ctx, wc.WorkoutPlanID)
		if err != nil {
			return 0, err
		}

		if wp.CurrentCycleID == wc.ID {
			// Create a new cycle for the next week
			nextWeek := wc.WeekNumber + 1

			newCycle := &workout.WorkoutCycle{
				WorkoutPlanID:   wp.ID,
				WeekNumber:      nextWeek,
				Name:            fmt.Sprintf("Week #%d", nextWeek),
				PreviousCycleID: wc.ID,
			}

			if err := s.workoutCycleRepo.Create(ctx, newCycle); err != nil {
				return 0, err
			}

			wc.NextCycleID = newCycle.ID
			if err := s.workoutCycleRepo.Update(ctx, wc); err != nil {
				return 0, err
			}

			wp.CurrentCycleID = newCycle.ID
			if err := s.workoutPlanRepo.Update(ctx, wp); err != nil {
				return 0, err
			}
		}
	}

	return wc.NextCycleID, nil
}

func (s *workoutServiceImpl) DeleteWorkoutCycle(ctx context.Context, id uint) error {
	cycle, err := s.workoutCycleRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	plan, err := s.workoutPlanRepo.GetByID(ctx, cycle.WorkoutPlanID)
	if err != nil {
		return err
	}

	if cycle.PreviousCycleID == 0 {
		return fmt.Errorf("cannot delete the first cycle of a workout plan")
	}

	if cycle.NextCycleID != 0 {
		// Move pointer from the previous cycle to the next cycle

		if err := s.workoutCycleRepo.UpdateNextCycleID(ctx, cycle.PreviousCycleID, cycle.NextCycleID); err != nil {
			return err
		}

		if err := s.workoutCycleRepo.UpdatePrevCycleID(ctx, cycle.NextCycleID, cycle.PreviousCycleID); err != nil {
			return err
		}

		if plan.CurrentCycleID == cycle.ID {
			plan.CurrentCycleID = cycle.NextCycleID
			if err := s.workoutPlanRepo.Update(ctx, plan); err != nil {
				return err
			}
		}
	} else {
		// prevCycleIncompleteWorkoutsCounts, err := s.workoutRepo.GetIncompleteWorkoutsCount(ctx, cycle.PreviousCycleID)
		// if err != nil {
		// 	return err
		// }

		// // If there is no next cycle and all previous workouts are completed, we just clear the current cycle data and dont change anything
		// if prevCycleIncompleteWorkoutsCounts == 0 {
		// 	if err := s.workoutCycleRepo.ClearData(ctx, id); err != nil {
		// 		return err
		// 	}
		// 	return nil
		// }

		if err := s.workoutCycleRepo.Complete(ctx, &workout.WorkoutCycle{ID: cycle.PreviousCycleID, Completed: false}); err != nil {
			return err
		}

		if err := s.workoutCycleRepo.UpdateNextCycleID(ctx, cycle.PreviousCycleID, 0); err != nil {
			return err
		}

		if plan.CurrentCycleID == cycle.ID {
			plan.CurrentCycleID = cycle.PreviousCycleID
			if err := s.workoutPlanRepo.Update(ctx, plan); err != nil {
				return err
			}
		}
	}
	return s.workoutCycleRepo.Delete(ctx, id)

}

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
func (s *workoutServiceImpl) UpdateWorkout(ctx context.Context, w *workout.Workout) error {
	return s.workoutRepo.Update(ctx, w)
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
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise, qt int64) error {
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

	if qt <= 0 {
		return fmt.Errorf("sets quantity must be greater than 0")
	}

	prevSets, err := s.GetPreviousSets(ctx, e.IndividualExerciseID, qt)
	if err != nil {
		return err
	}

	for i := int64(0); i < qt; i++ {
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

	w, err := s.workoutRepo.GetByID(ctx, e.WorkoutID)
	if err != nil {
		return err
	}

	w.Completed = false

	if err := s.workoutRepo.Complete(ctx, w); err != nil {
		return err
	}

	return s.workoutExerciseRepo.Create(ctx, e)
}
func (s *workoutServiceImpl) GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	return s.workoutExerciseRepo.GetByWorkoutID(ctx, workoutID)
}

func (s *workoutServiceImpl) UpdateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	// individualExercise, err := s.workoutExerciseRepo.GetRelatedIndividualExercise(ctx, e.ID)
	// if err != nil {
	// 	return err
	// }

	// currentVolume := individualExercise.CurrentWeight * float64(individualExercise.CurrentReps)
	// newVolume := e.Weight * float64(e.Reps)

	// if newVolume > currentVolume {
	// 	individualExercise.CurrentReps = e.Reps
	// 	individualExercise.CurrentWeight = e.Weight
	// }

	// if err := s.individualExerciseRepo.Update(ctx, individualExercise); err != nil {
	// 	return err
	// }

	return s.workoutExerciseRepo.Update(ctx, e)
}

func (s *workoutServiceImpl) CompleteWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	err := s.workoutExerciseRepo.Complete(ctx, e)
	if err != nil {
		return err
	}

	w, err := s.workoutRepo.GetByID(ctx, e.WorkoutID)
	if err != nil {
		return err
	}

	incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, w.ID)
	if err != nil {
		return err
	}

	w.Completed = incompletedExercisesCount == 0

	err = s.workoutRepo.Complete(ctx, w)
	if err != nil {
		return err
	}

	return nil
}

func (s *workoutServiceImpl) MoveWorkoutExercise(ctx context.Context, workoutID, exerciseID uint, direction string) error {
	workoutExercise, err := s.workoutExerciseRepo.GetByID(ctx, exerciseID)
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
		return fmt.Errorf("failed to swap workout exercises: %w", err)
	}

	return nil
}

func (s *workoutServiceImpl) ReplaceWorkoutExercise(ctx context.Context, workoutID, exerciseID, individualExerciseID uint, sets int64) (*workout.WorkoutExercise, error) {
	if sets <= 0 {
		return nil, fmt.Errorf("sets quantity must be greater than 0")
	}

	workoutExercise, err := s.workoutExerciseRepo.GetByID(ctx, exerciseID)
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

	for i := int64(0); i < sets; i++ {
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

	w, err := s.workoutRepo.GetByID(ctx, workoutExercise.WorkoutID)
	if err != nil {
		return nil, err
	}

	w.Completed = false
	if err := s.workoutRepo.Complete(ctx, w); err != nil {
		return nil, err
	}

	return newExercise, nil
}

func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, id uint) error {
	workoutExercise, err := s.workoutExerciseRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	workoutID := workoutExercise.WorkoutID
	deletedIndex := workoutExercise.Index

	if err := s.workoutExerciseRepo.Delete(ctx, id); err != nil {
		return err
	}

	if err := s.workoutExerciseRepo.DecrementIndexesAfter(ctx, workoutID, deletedIndex); err != nil {
		return err
	}

	workout, err := s.workoutRepo.GetByID(ctx, workoutID)
	if err != nil {
		return err
	}

	var completed bool
	if len(workout.WorkoutExercises) == 0 {
		completed = false
	} else {
		incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, workoutID)
		if err != nil {
			return err
		}
		completed = incompletedExercisesCount == 0
	}

	workout.Completed = completed
	if err := s.workoutRepo.Complete(ctx, workout); err != nil {
		return err
	}

	return nil
}

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

	ie, err := s.individualExerciseRepo.GetByID(ctx, we.IndividualExerciseID)
	if err != nil {
		return err
	}

	ie.LastCompletedWorkoutExerciseID = &we.ID
	if err := s.individualExerciseRepo.Update(ctx, ie); err != nil {
		return err
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

	w, err := s.workoutRepo.GetByID(ctx, we.WorkoutID)
	if err != nil {
		return err
	}

	incompletedExercisesCount, err := s.workoutExerciseRepo.GetIncompleteExercisesCount(ctx, w.ID)
	if err != nil {
		return err
	}

	w.Completed = incompletedExercisesCount == 0
	err = s.workoutRepo.Complete(ctx, w)
	if err != nil {
		return err
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
		return fmt.Errorf("failed to swap workout sets: %w", err)
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
			return nil, fmt.Errorf("failed to get last 5 workout exercises for individual exercise %d", ie.ID)
		}
		if len(last5WorkoutExercises) == 0 {
			continue
		}

		bestWeight := 0.0
		bestReps := 0

		for _, we := range last5WorkoutExercises {
			for _, ws := range we.WorkoutSets {
				if ws.Weight * float64(ws.Reps) > bestWeight * float64(bestReps) {
					bestWeight = ws.Weight
					bestReps = ws.Reps
				}
			}
		}

		ie.CurrentWeight = bestWeight
		ie.CurrentReps = bestReps
	}
	// Find best weight and reps for each individual exercise in the
	return individualExercise, nil

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
