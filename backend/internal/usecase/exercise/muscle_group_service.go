package exercise

import (
	"context"
	"fmt"
	"unicode"

	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *exerciseServiceImpl) CreateMuscleGroup(ctx context.Context, mg *workout.MuscleGroup, autoTranslate bool) error {
	err := s.muscleGroupRepo.Create(ctx, mg)
	if err != nil {
		return err
	}

	if !autoTranslate {
		return nil
	}

	for iso, locale := range translations.ISO2Locale {
		val, err := s.translator.Translate(ctx, mg.Name, iso)
		if err != nil {
			return fmt.Errorf("auto-translate muscle group name failed for locale %s: %w", locale, err)
		}

		if len(val) > 0 {
			runes := []rune(val)
			runes[0] = unicode.ToUpper(runes[0])
			val = string(runes)
		}

		tr := &translations.Translation{
			Namespace: "translation",
			Locale:    locale,
			Key:       fmt.Sprintf("muscle_group.%s", mg.Slug),
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

func (s *exerciseServiceImpl) GetMuscleGroupByID(ctx context.Context, id uint) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetByID(ctx, id)
}

func (s *exerciseServiceImpl) GetAllMuscleGroups(ctx context.Context) ([]*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.GetAll(ctx)
}

func (s *exerciseServiceImpl) UpdateMuscleGroup(ctx context.Context, id uint, updates map[string]any) (*workout.MuscleGroup, error) {
	return s.muscleGroupRepo.UpdateReturning(ctx, id, updates)
}

func (s *exerciseServiceImpl) DeleteMuscleGroup(ctx context.Context, id uint) error {
	return s.muscleGroupRepo.Delete(ctx, id)
}
