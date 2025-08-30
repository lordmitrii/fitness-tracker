package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

// Returns id of the first cycle
func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) (uint, error) {
	if wp.Active {
		// If the workout plan is active, we need to set other plans to inactive
		plans, err := s.workoutPlanRepo.GetByUserID(ctx, wp.UserID)
		if err != nil {
			return 0, err
		}

		for _, plan := range plans {
			if plan.Active {
				plan.Active = false
				if _, err := s.workoutPlanRepo.SetActive(ctx, plan); err != nil {
					return 0, err
				}
			}
		}
	}

	// Create the workout plan with the initial cycle
	if err := s.workoutPlanRepo.Create(ctx, wp); err != nil {
		return 0, err
	}

	firstCycle := &workout.WorkoutCycle{
		WorkoutPlanID: wp.ID,
		WeekNumber:    1,
		Name:          "Week #1",
	}

	if err := s.workoutCycleRepo.Create(ctx, firstCycle); err != nil {
		return 0, err
	}

	if err := s.workoutPlanRepo.Update(ctx, wp.ID, map[string]any{"current_cycle_id": firstCycle.ID}); err != nil {
		return 0, err
	}

	return firstCycle.ID, nil
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByID(ctx, id)

}

func (s *workoutServiceImpl) GetWorkoutPlansByUserID(ctx context.Context, userID uint) ([]*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.GetByUserID(ctx, userID)
}

func (s *workoutServiceImpl) UpdateWorkoutPlan(ctx context.Context, id uint, updates map[string]any) (*workout.WorkoutPlan, error) {
	return s.workoutPlanRepo.UpdateReturning(ctx, id, updates)

}

func (s *workoutServiceImpl) DeleteWorkoutPlan(ctx context.Context, id uint) error {
	return s.workoutPlanRepo.Delete(ctx, id)
}

func (s *workoutServiceImpl) SetActiveWorkoutPlan(ctx context.Context, id uint, active bool) (*workout.WorkoutPlan, error) {
	wp, err := s.workoutPlanRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	wp.Active = active

	if wp.Active {
		// If the workout plan is active, we need to set other plans to inactive
		plans, err := s.workoutPlanRepo.GetByUserID(ctx, wp.UserID)
		if err != nil {
			return nil, err
		}
		for _, plan := range plans {
			if plan.Active && plan.ID != wp.ID {
				plan.Active = false
				if _, err := s.workoutPlanRepo.SetActive(ctx, plan); err != nil {
					return nil, err
				}
			}
		}
	}

	return s.workoutPlanRepo.SetActive(ctx, wp)
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
