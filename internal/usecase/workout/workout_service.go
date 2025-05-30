package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type workoutServiceImpl struct {
	workoutPlanRepo workout.WorkoutPlanRepository
	workoutCycleRepo workout.WorkoutCycleRepository
	workoutRepo     workout.WorkoutRepository
	exerciseRepo    workout.WorkoutExerciseRepository
}

func NewWorkoutService(workoutPlanRepo workout.WorkoutPlanRepository, workoutCycleRepo workout.WorkoutCycleRepository, workoutRepo workout.WorkoutRepository, exerciseRepo workout.WorkoutExerciseRepository) *workoutServiceImpl {
	return &workoutServiceImpl{
		workoutPlanRepo: workoutPlanRepo,
		workoutCycleRepo: workoutCycleRepo,
		workoutRepo:     workoutRepo,
		exerciseRepo:    exerciseRepo,
	}
}

func (s *workoutServiceImpl) CreateWorkoutPlan(ctx context.Context, wp *workout.WorkoutPlan) error {
	return s.workoutPlanRepo.Create(ctx, wp)
}

func (s *workoutServiceImpl) GetWorkoutPlanByID(ctx context.Context, id uint) (*workout.WorkoutPlan, error) {
	plan, err := s.workoutPlanRepo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
	

    for _, c := range plan.WorkoutCycles {
        if !c.Completed {
            plan.CurrentCycleID = c.ID
            return plan, nil
        }
    }

	wc := &workout.WorkoutCycle{
		WorkoutPlanID: id,
		Name: "New Cycle",
	}

	err = s.CreateWorkoutCycle(ctx, wc)
	plan.CurrentCycleID = wc.ID

	return plan, err
    
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
	return s.workoutCycleRepo.GetByID(ctx, id)
}

func (s *workoutServiceImpl) GetWorkoutCyclesByWorkoutPlanID(ctx context.Context, workoutPlanID uint) ([]*workout.WorkoutCycle, error) {
	return s.workoutCycleRepo.GetByWorkoutPlanID(ctx, workoutPlanID)
}

func (s *workoutServiceImpl) UpdateWorkoutCycle(ctx context.Context, wc *workout.WorkoutCycle) error {
	return s.workoutCycleRepo.Update(ctx, wc)
}

func (s *workoutServiceImpl) DeleteWorkoutCycle(ctx context.Context, id uint) error {
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
func (s *workoutServiceImpl) CreateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	return s.exerciseRepo.Create(ctx, e)
}
func (s *workoutServiceImpl) GetWorkoutExerciseByID(ctx context.Context, id uint) (*workout.WorkoutExercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}
func (s *workoutServiceImpl) GetWorkoutExercisesByWorkoutID(ctx context.Context, workoutID uint) ([]*workout.WorkoutExercise, error) {
	return s.exerciseRepo.GetByWorkoutID(ctx, workoutID)
}

func (s *workoutServiceImpl) UpdateWorkoutExercise(ctx context.Context, e *workout.WorkoutExercise) error {
	return s.exerciseRepo.Update(ctx, e)
}

func (s *workoutServiceImpl) DeleteWorkoutExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}
