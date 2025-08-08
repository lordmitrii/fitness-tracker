package ai

import (
	"context"
	"encoding/json"
	"fmt"

	usecase "github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type aiServiceImpl struct {
	workoutService usecase.WorkoutService
	userService    usecase.UserService
}

func NewAIService(workoutService usecase.WorkoutService, userService usecase.UserService) *aiServiceImpl {
	return &aiServiceImpl{
		workoutService: workoutService,
		userService:    userService,
	}
}

func (s *aiServiceImpl) AskStatsQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error) {
	stats, err := s.workoutService.GetIndividualExerciseStats(ctx, userID)
	if err != nil {
		return "", "", err
	}

	profile, err := s.userService.GetProfile(ctx, userID)
	if err != nil {
		return "", "", err
	}

	processedStats := []map[string]any{}

	for _, stat := range stats {
		if stat.CurrentWeight == 0 && stat.CurrentReps == 0 {
			continue
		}

		statMap := map[string]any{
			"exercise_name":   stat.Name,
			"best_set_reps":   stat.CurrentReps,
			"best_set_weight": stat.CurrentWeight,
		}
		if stat.IsTimeBased {
			statMap["is_time_based"] = true
		}
		processedStats = append(processedStats, statMap)
	}

	if profile != nil {
		processedStats = append(processedStats, map[string]any{
			"user_weight": profile.WeightKg,
			"user_height": profile.HeightCm,
			"user_age":    profile.Age,
			"user_sex":    profile.Sex,
		})
	}

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

	reply, prevRespID, err := CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	return reply, prevRespID, err
}
