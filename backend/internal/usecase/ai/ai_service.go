package ai

import (
	"context"
	"encoding/json"
	"fmt"
)


func (s *aiServiceImpl) AskStatsQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error) {
	stats, err := s.workoutService.GetIndividualExerciseStats(ctx, userID)
	if err != nil {
		return "", "", err
	}

	profile, _ := s.userService.GetProfile(ctx, userID)

	processedStats := BuildProcessedStats(stats, profile)
	statsJson, _ := json.Marshal(processedStats)
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"Here is the user's exercise and profile stats as JSON: %s\n\nThe user asks: %s\nUser uses metric system.",
			statsJson, question,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return callOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
}

func (s *aiServiceImpl) AskWorkoutsQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error) {
	activePlan, err := s.workoutService.GetActivePlanByUserID(ctx, userID)
	if err != nil {
		return "", "", err
	}

	if activePlan == nil || activePlan.CurrentCycleID == 0 {
		var fullPrompt string
		if previousResponseID == "" {
			fullPrompt = fmt.Sprintf(
				"There is no active workout plan/cycle for this user right now.\n\nThe user asks: %s\nUser uses metric system.",
				question,
			)
		} else {
			fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
		}
		return callOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	}

	currentCycle, _ := s.workoutService.GetWorkoutCycleByID(ctx, activePlan.CurrentCycleID)

	processedCycle := BuildProcessedCycle(currentCycle)
	cycleJson, _ := json.Marshal(processedCycle)
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"Here is the user's current workout cycle as JSON: %s\n\nThe user asks: %s\nUser uses metric system.",
			cycleJson, question,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return callOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
}

func (s *aiServiceImpl) AskGeneralQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error) {
	var fullPrompt string

	if previousResponseID == "" {
		fullPrompt = fmt.Sprintf(
			"The user asks: %s\n",
			question,
		)
	} else {
		fullPrompt = fmt.Sprintf("The user asks: %s\n", question)
	}

	return callOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	// return fmt.Sprintf("General question: %s", question), fmt.Sprintf("previous_response_id: %s", previousResponseID), nil
}
