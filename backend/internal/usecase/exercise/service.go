package exercise

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type exerciseServiceImpl struct {
	exerciseRepo    workout.ExerciseRepository
	muscleGroupRepo workout.MuscleGroupRepository
}

func NewExerciseService(
	exerciseRepo workout.ExerciseRepository,
	muscleGroupRepo workout.MuscleGroupRepository,
) *exerciseServiceImpl {
	return &exerciseServiceImpl{
		exerciseRepo:    exerciseRepo,
		muscleGroupRepo: muscleGroupRepo,
	}
}
