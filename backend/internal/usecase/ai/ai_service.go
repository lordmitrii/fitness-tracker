package ai

import (
	"context"
	"encoding/json"
	"fmt"
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

	currentCycle, _ := s.workoutService.GetWorkoutCycleByID(ctx, *activePlan.CurrentCycleID)

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
