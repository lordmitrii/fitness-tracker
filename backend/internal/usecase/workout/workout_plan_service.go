package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
)

// Order of locks used:
// 1. workout_plans
// 2. workout_cycles
func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, in *workout.WorkoutPlan) (*workout.WorkoutPlan, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutPlan, error) {
		wp, err := s.workoutPlanRepo.CreateReturning(ctx, &workout.WorkoutPlan{
			Name:   in.Name,
			UserID: in.UserID,
			Active: false,
		})
		if err != nil {
			return nil, err
		}

		firstCycle := &workout.WorkoutCycle{
			WorkoutPlanID: wp.ID,
			WeekNumber:    1,
			Name:          "Week #1",
		}

		if err := s.workoutCycleRepo.Create(ctx, firstCycle); err != nil {
			return nil, err
		}

		wp, err = s.workoutPlanRepo.UpdateReturning(ctx, wp.ID, map[string]any{
			"current_cycle_id": firstCycle.ID,
		})
		if err != nil {
			return nil, err
		}

		if in.Active {
			if err := s.workoutPlanRepo.DeactivateOthers(ctx, wp.UserID, wp.ID); err != nil {
				return nil, err
			}
			wp, err = s.workoutPlanRepo.UpdateReturning(ctx, wp.ID, map[string]any{
				"active": true,
			})
			if err != nil {
				return nil, err
			}
		}
		return wp, nil
	})
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, id)

}

func (s *workoutServiceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) UpdateWorkoutPlan(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutPlan, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutPlan, error) {
		return s.workoutPlanRepo.UpdateReturning(ctx, id, updates)
	})
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) DeleteWorkoutPlan(ctx context.Context, id uint) error {
	return uow.Do(ctx, s.db, func(ctx context.Context) error {
		return s.workoutPlanRepo.Delete(ctx, id)
	})
}

// Order of locks used:
// 1. workout_plans
func (s *workoutServiceImpl) SetActiveWorkoutPlan(ctx context.Context, id uint, active bool) (*workout.WorkoutPlan, error) {
	return uow.DoR(ctx, s.db, func(ctx context.Context) (*workout.WorkoutPlan, error) {
		wp, err := s.workoutPlanRepo.GetByIDForUpdate(ctx, id)
		if err != nil {
			return nil, err
		}

		if wp.Active == active {
			return wp, nil
		}
		if active {
			if err := s.workoutPlanRepo.DeactivateOthers(ctx, wp.UserID, wp.ID); err != nil {
				return nil, err
			}
		}

		return s.workoutPlanRepo.UpdateReturning(ctx, wp.ID, map[string]any{"active": active})
	})
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
