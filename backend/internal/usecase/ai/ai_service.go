package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/ai"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func (s *aiServiceImpl) AskStatsQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error) {
	userSettings, err := s.userService.GetUserSettings(ctx, userID)
	if err != nil {
		return "", "", err
	}
	stats, err := s.workoutService.GetIndividualExerciseStats(ctx, userID)
	if err != nil {
		return "", "", err
	}

	var unitSystem string
	if userSettings != nil {
		unitSystem = userSettings.UnitSystem
	} else {
		unitSystem = "metric"
	}

	profile, _ := s.userService.GetProfile(ctx, userID)

	processedStats := BuildProcessedStats(stats, profile, unitSystem)
	statsJson, _ := json.Marshal(processedStats)
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"Here is the user's exercise and profile stats as JSON: %s\n\nThe user asks: %s\nUser uses \"%s\" unit system\nUser language: %s.",
			statsJson, question, unitSystem, lang,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return s.openai.CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
}

func (s *aiServiceImpl) AskWorkoutsQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error) {
	activePlan, err := s.workoutService.GetActivePlanByUserID(ctx, userID)
	if err != nil {
		return "", "", err
	}

	userSettings, err := s.userService.GetUserSettings(ctx, userID)
	if err != nil {
		return "", "", err
	}

	var unitSystem string
	if userSettings != nil {
		unitSystem = userSettings.UnitSystem
	} else {
		unitSystem = "metric"
	}

	if activePlan == nil || activePlan.CurrentCycleID == nil {
		var fullPrompt string
		if previousResponseID == "" {
			fullPrompt = fmt.Sprintf(
				"There is no active workout plan/cycle for this user right now.\n\nThe user asks: %s\nUser uses metric system\nUser language: %s.",
				question, lang,
			)
		} else {
			fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
		}
		return s.openai.CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	}

	currentCycle, _ := s.workoutService.GetWorkoutCycleByID(ctx, userID, activePlan.ID, *activePlan.CurrentCycleID)

	processedCycle := BuildProcessedCycle(currentCycle)
	cycleJson, _ := json.Marshal(processedCycle)
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"Here is the user's current workout cycle as JSON: %s\n\nThe user asks: %s\nUser uses \"%s\" unit system\nUser language: %s.",
			cycleJson, question, unitSystem, lang,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return s.openai.CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
}

func (s *aiServiceImpl) AskGeneralQuestion(ctx context.Context, userID uint, question, lang, previousResponseID string) (string, string, error) {
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"The user asks: %s\nUser language: %s.",
			question, lang,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return s.openai.CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	// return fmt.Sprintf("General question: %s", question), fmt.Sprintf("previous_response_id: %s", previousResponseID), nil
}

func (s *aiServiceImpl) lookupExerciseBySlug(ctx context.Context, userID uint, slug string) (*workout.IndividualExercise, error) {
	ex, err := s.exerciseService.GetExerciseBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	return s.workoutService.GetOrCreateIndividualExercise(ctx, userID, &workout.IndividualExercise{
		ExerciseID:    &ex.ID,
		Name:          ex.Name,
		MuscleGroupID: ex.MuscleGroupID,
	})
}

func (s *aiServiceImpl) GenerateWorkoutPlan(ctx context.Context, userID uint, prompt string, days int, lang string) (*workout.WorkoutPlan, error) {
	profile, _ := s.userService.GetProfile(ctx, userID)

	exercises, err := s.exerciseService.GetAllExercises(ctx)
	if err != nil {
		return nil, err
	}

	var fullPrompt string
	if profile != nil {
		fullPrompt = fmt.Sprintf(
			"Generate a workout plan based on the following prompt: %s\nUser profile: Age %d, Height %d mm, Weight %d g. User prefers %d days per week workouts.",
			prompt, profile.Age, profile.Height, profile.Weight, days,
		)
	} else {
		fullPrompt = fmt.Sprintf(
			"Generate a workout plan based on the following prompt: %s\nUser profile: Unknown. User prefers %d days per week workouts.",
			prompt, days,
		)
	}

	res, err := s.openai.GenerateWorkoutPlan(ctx, fullPrompt, exercises, 2048)
	if err != nil {
		return nil, err
	}
	wp, err := ConvertWorkoutPlanDtoToModel(ctx, s.lookupExerciseBySlug, res, userID)
	if err != nil {
		return nil, err
	}
	return &wp, nil
}

func (s *aiServiceImpl) GenerateWorkoutPlanWithDB(ctx context.Context, userID uint, prompt string, days int, lang string) (*workout.WorkoutPlan, error) {
	profile, _ := s.userService.GetProfile(ctx, userID)

	var fullPrompt string
	if profile != nil {
		fullPrompt = fmt.Sprintf(
			"Generate a workout plan based on the following prompt: %s\nUser profile: Age %d, Height %d mm, Weight %d g. User prefers %d days per week workouts.",
			prompt, profile.Age, profile.Height, profile.Weight, days,
		)
	} else {
		fullPrompt = fmt.Sprintf(
			"Generate a workout plan based on the following prompt: %s\nUser profile: Unknown. User prefers %d days per week workouts.",
			prompt, days,
		)
	}

	listMG := func(ctx context.Context, limit int) ([]string, error) {

		mgs, err := s.exerciseService.GetAllMuscleGroups(ctx)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(mgs))
		for i, mg := range mgs {
			if i >= limit {
				break
			}
			out = append(out, mg.Name)
		}
		return out, nil
	}

	searchEx := func(ctx context.Context, groupQuery string, limit, offset int) ([]map[string]any, error) {
		rows, err := s.exerciseService.GetExerciseNamesByMuscleName(ctx, groupQuery, limit, offset)
		if err != nil {
			return nil, err
		}
		out := make([]map[string]any, 0, len(rows))
		for _, r := range rows {
			out = append(out, map[string]any{"slug": r.Slug, "name": r.Name})
		}
		return out, nil
	}

	res, err := s.openai.GenerateWorkoutPlanWithDB(ctx, fullPrompt, 8192, listMG, searchEx)
	if err != nil {
		return nil, err
	}
	wp, err := ConvertWorkoutPlanDtoToModel(ctx, s.lookupExerciseBySlug, res, userID)
	if err != nil {
		return nil, err
	}
	return &wp, nil
}

func ConvertWorkoutPlanDtoToModel(
	ctx context.Context,
	lookup func(ctx context.Context, userID uint, slug string) (*workout.IndividualExercise, error),
	dto *ai.WorkoutPlanDto,
	userID uint,
) (workout.WorkoutPlan, error) {
	if dto == nil {
		return workout.WorkoutPlan{}, fmt.Errorf("nil dto")
	}

	wp := workout.WorkoutPlan{
		Name:          dto.Name,
		Active:        false,
		UserID:        userID,
		WorkoutCycles: make([]*workout.WorkoutCycle, 0, len(dto.WorkoutCycles)),
	}

	for _, cycleDto := range dto.WorkoutCycles {
		wc := workout.WorkoutCycle{
			Name:     cycleDto.Name, // "Week 1"
			Workouts: make([]*workout.Workout, 0, len(cycleDto.Workouts)),
		}

		for _, wDto := range cycleDto.Workouts {
			w := &workout.Workout{
				Name:             wDto.Name, // "Day 1"
				WorkoutExercises: make([]*workout.WorkoutExercise, 0, len(wDto.WorkoutExercises)),
			}

			for exIdx, item := range wDto.WorkoutExercises {
				ie, err := lookup(ctx, userID, item.Slug)
				if err != nil {
					return workout.WorkoutPlan{}, fmt.Errorf("exercise with slug '%s' not found: %w", item.Slug, err)
				}

				we := &workout.WorkoutExercise{
					IndividualExerciseID: ie.ID,
					Index:                exIdx + 1,
				}

				for setIdx := 0; setIdx < item.SetsQt; setIdx++ {
					we.WorkoutSets = append(we.WorkoutSets, &workout.WorkoutSet{
						Index: setIdx + 1,
					})
				}

				w.WorkoutExercises = append(w.WorkoutExercises, we)
			}

			wc.Workouts = append(wc.Workouts, w)
		}

		wp.WorkoutCycles = append(wp.WorkoutCycles, &wc)
	}

	return wp, nil
}
