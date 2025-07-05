package workout

import (
	"context"
	"fmt"
	custom_err "github.com/lordmitrii/golang-web-gin/internal/domain/errors"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"time"
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
				WorkoutID: newWorkout.ID,
				IndividualExerciseID: we.IndividualExerciseID,
				Index:     we.Index,
				Completed: false,
			}
			// Copy sets from the previous workout exercise
			for _, ws := range we.WorkoutSets {
				newSet := &workout.WorkoutSet{
					WorkoutExerciseID:    newExercise.ID,
					Index:                ws.Index,
					PreviousWeight:       ws.Weight,
					PreviousReps:         ws.Reps,
					Completed:            false,
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
		prevCycleIncompleteWorkoutsCounts, err := s.workoutRepo.GetIncompleteWorkoutsCount(ctx, cycle.PreviousCycleID)
		if err != nil {
			return err
		}

		// If there is no next cycle and all previous workouts are completed, we just clear the current cycle data and dont change anything
		if prevCycleIncompleteWorkoutsCounts == 0 {
			if err := s.workoutCycleRepo.ClearData(ctx, id); err != nil {
				return err
			}
			return nil
		}

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
	return s.workoutRepo.Create(ctx, w)
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
	return s.workoutRepo.Delete(ctx, id)
}
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise, qt int64) error {
	if qt <= 0 {
		return fmt.Errorf("sets quantity must be greater than 0")
	}
	for i := int64(0); i < qt; i++ {
		set := &workout.WorkoutSet{
			WorkoutExerciseID: e.ID,
			Index:             int(i),
			Completed:         false,
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

func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, id uint) error {
	return s.workoutExerciseRepo.Delete(ctx, id)
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
//   "muscle_group": "",                      "muscle_group": "Chest",
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
		individualExercise.MuscleGroup = exercise.MuscleGroup
		if err := s.individualExerciseRepo.Create(ctx, individualExercise); err != nil {
			return nil, err
		}
		return individualExercise, nil
	}

	// Case 2 & 4: exerciseID is not provided (0)
	existingIndividualExercise, err := s.individualExerciseRepo.GetByNameMuscleGroupAndUser(ctx, individualExercise.Name, individualExercise.MuscleGroup, individualExercise.UserID)
	if err == nil {
		// Case 2: Found existing individual exercise
		return existingIndividualExercise, nil
	}
	if err != custom_err.ErrIndividualExerciseNotFound {
		return nil, err
	}

	if individualExercise.Name == "" || individualExercise.MuscleGroup == "" {
		return nil, fmt.Errorf("name and muscle group must be provided for creating a new individual exercise if exerciseID is not provided")
	}

	// Case 4: Not found, create a new individual exercise without linking it to an exercise
	if err := s.individualExerciseRepo.Create(ctx, individualExercise); err != nil {
		return nil, err
	}
	return individualExercise, nil
}

func (s *workoutServiceImpl) CreateWorkoutSet(ctx context.Context, ws *workout.WorkoutSet) error {
	we, err := s.workoutExerciseRepo.GetByID(ctx, ws.WorkoutExerciseID)
	if err != nil {
		return err
	}

	we.Completed = false
	if err := s.workoutExerciseRepo.Complete(ctx, we); err != nil {
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

func (s *workoutServiceImpl) DeleteWorkoutSet(ctx context.Context, id uint) error {
	return s.workoutSetRepo.Delete(ctx, id)
}

func (s *workoutServiceImpl) GetIncompleteSetsCount(ctx context.Context, workoutExerciseID uint) (int64, error) {
	return s.workoutSetRepo.GetIncompleteSetsCount(ctx, workoutExerciseID)
}
