package workout

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

// Order of locks used:
// 1. workout_plans
// 2. workout_cycles
func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, userId uint, in *workout.WorkoutPlan) (*workout.WorkoutPlan, error) {
	var wp *workout.WorkoutPlan
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutPlanRepo.CreateReturning(ctx, userId, &workout.WorkoutPlan{
			Name:   in.Name,
			UserID: in.UserID,
			Active: false,
		})
		if err != nil {
			return err
		}
		wp = res

		firstCycle := &workout.WorkoutCycle{
			WorkoutPlanID: wp.ID,
			WeekNumber:    1,
			Name:          "Week #1",
		}

		if err := s.workoutCycleRepo.Create(ctx, userId, wp.ID, firstCycle); err != nil {
			return err
		}

		wp, err = s.workoutPlanRepo.UpdateReturning(ctx, userId, wp.ID, map[string]any{
			"current_cycle_id": firstCycle.ID,
		})
		if err != nil {
			return err
		}

		if in.Active {
			if err := s.workoutPlanRepo.DeactivateOthers(ctx, wp.UserID, wp.ID); err != nil {
				return err
			}
			wp, err = s.workoutPlanRepo.UpdateReturning(ctx, userId, wp.ID, map[string]any{
				"active": true,
			})
			if err != nil {
				return err
			}
		}
		return nil
	})
	return wp, err
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, userId, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, userId, id)

}

func (s *workoutServiceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) UpdateWorkoutPlan(ctx context.Context, userId, id uint, updates map[string]any) (*workout.WorkoutPlan, error) {
	var wp *workout.WorkoutPlan
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutPlanRepo.UpdateReturning(ctx, userId, id, updates)
		if err != nil {
			return err
		}
		wp = res
		return nil
	})
	return wp, err
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) DeleteWorkoutPlan(ctx context.Context, userId, id uint) error {
	return s.tx.Do(ctx, func(ctx context.Context) error {
		return s.workoutPlanRepo.Delete(ctx, userId, id)
	})
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) SetActiveWorkoutPlan(ctx context.Context, userId, id uint, active bool) (*workout.WorkoutPlan, error) {
	var wp *workout.WorkoutPlan
	err := s.tx.Do(ctx, func(ctx context.Context) error {
		res, err := s.workoutPlanRepo.GetByIDForUpdate(ctx, userId, id)
		if err != nil {
			return err
		}

		if res.Active == active {
			wp = res
			return nil
		}
		if active {
			if err := s.workoutPlanRepo.DeactivateOthers(ctx, userId, res.ID); err != nil {
				return err
			}
		}

		wp, err = s.workoutPlanRepo.UpdateReturning(ctx, userId, res.ID, map[string]any{"active": active})
		return err
	})
	return wp, err
}

func (s *workoutServiceImpl) GetActivePlanByUserID(ctx context.Context, userID uint) (*workout.WorkoutPlan, error) {
	workoutPlans, err := s.workoutPlanRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for _, wp := range workoutPlans {
		if wp.Active {
			return wp, nil
		}
	}

	return nil, nil
}
