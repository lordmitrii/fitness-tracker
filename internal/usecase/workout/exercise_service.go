package workout

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type exerciseServiceImpl struct {
	exerciseRepo    workout.ExerciseRepository
	muscleGroupRepo workout.MuscleGroupRepository
}

func NewExerciseService(exerciseRepo workout.ExerciseRepository, muscleGroupRepo workout.MuscleGroupRepository) *exerciseServiceImpl {
	return &exerciseServiceImpl{exerciseRepo: exerciseRepo, muscleGroupRepo: muscleGroupRepo}
}

func (s *exerciseServiceImpl) CreateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Create(ctx, e)
}

func (s *exerciseServiceImpl) GetExerciseByID(ctx context.Context, id uint) (*workout.Exercise, error) {
	return s.exerciseRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetExercisesByMuscleGroupID(ctx context.Context, muscleGroupID *uint) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetByMuscleGroupID(ctx, muscleGroupID)
}

func (s *exerciseServiceImpl) GetAllExercises(ctx context.Context) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateExercise(ctx context.Context, e *workout.Exercise) error {
	return s.exerciseRepo.Update(ctx, e)
}

func (s *exerciseServiceImpl) DeleteExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}

func (s *exerciseServiceImpl) CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error {
	return s.muscleGroupRepo.Create(ctx, mg)
}

func (s *exerciseServiceImpl) GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup) error {
	return s.muscleGroupRepo.Update(ctx, mg)
}

func (s *exerciseServiceImpl) DeleteMuscleGroup(ctx context.Context, id uint) error {
	return s.muscleGroupRepo.Delete(ctx, id)
}
