package exercise

import (
	"context"
	"fmt"
	"unicode"

	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *exerciseServiceImpl) CreateExercise(ctx context.Context, e *workout.Exercise, autoTranslate bool) error {
	err := s.exerciseRepo.Create(ctx, e)
	if err != nil {
		return err
	}
	if !autoTranslate {
		return nil
	}

	for iso, locale := range translations.ISO2Locale {
		val, err := s.translator.Translate(ctx, e.Name, iso)
		if err != nil {
			return fmt.Errorf("auto-translate exercise name failed for locale %s: %w", locale, err)
		}

		if len(val) > 0 {
			runes := []rune(val)
			runes[0] = unicode.ToUpper(runes[0])
			val = string(runes)
		}

		tr := &translations.Translation{
			Namespace: "translation",
			Locale:    locale,
			Key:       fmt.Sprintf("exercise.%s", e.Slug),
			Value:     val,
		}

		if err := s.translationRepo.Create(ctx, tr); err != nil {
			return fmt.Errorf("saving translation failed for locale %s: %w", locale, err)
		}

		if err := s.versionRepo.BumpVersion(ctx, versions.VersionTranslationKey(locale, "translation")); err != nil {
			return fmt.Errorf("bumping version failed for locale %s: %w", locale, err)
		}
	}
	return nil
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

func (s *exerciseServiceImpl) UpdateExercise(ctx context.Context, id uint, updates map[string]any) (*workout.Exercise, error) {
	return s.exerciseRepo.UpdateReturning(ctx, id, updates)
}

func (s *exerciseServiceImpl) DeleteExercise(ctx context.Context, id uint) error {
	return s.exerciseRepo.Delete(ctx, id)
}

func (s *exerciseServiceImpl) GetExerciseNamesByMuscleName(ctx context.Context, muscleName string, limit, offset int) ([]*workout.Exercise, error) {
	return s.exerciseRepo.GetExerciseNamesByMuscleName(ctx, muscleName, limit, offset)
}
