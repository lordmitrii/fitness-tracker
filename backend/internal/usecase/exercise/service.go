package exercise

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
)

type exerciseServiceImpl struct {
	exerciseRepo    workout.ExerciseRepository
	muscleGroupRepo workout.MuscleGroupRepository
	translator      translations.Translator
}

func NewExerciseService(
	exerciseRepo workout.ExerciseRepository,
	muscleGroupRepo workout.MuscleGroupRepository,
	translator translations.Translator,
) *exerciseServiceImpl {
	return &exerciseServiceImpl{
		exerciseRepo:    exerciseRepo,
		muscleGroupRepo: muscleGroupRepo,
		translator:      translator,
	}
}
