package exercise

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type exerciseServiceImpl struct {
	exerciseRepo    workout.ExerciseRepository
	muscleGroupRepo workout.MuscleGroupRepository
	translator      translations.Translator
	translationRepo translations.TranslationRepository
	versionRepo     versions.VersionRepository
}

func NewExerciseService(
	exerciseRepo workout.ExerciseRepository,
	muscleGroupRepo workout.MuscleGroupRepository,
	translator translations.Translator,
	translationRepo translations.TranslationRepository,
	versionRepo versions.VersionRepository,
) usecase.ExerciseService {
	return &exerciseServiceImpl{
		exerciseRepo:    exerciseRepo,
		muscleGroupRepo: muscleGroupRepo,
		translator:      translator,
		translationRepo: translationRepo,
		versionRepo:     versionRepo,
	}
}
