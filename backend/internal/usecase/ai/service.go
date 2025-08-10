package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
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

func buildProcessedStats(stats []*workout.IndividualExercise, profile *user.Profile) []map[string]any {
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

	return processedStats
}

func (s *aiServiceImpl) AskStatsQuestion(ctx context.Context, userID uint, question string, previousResponseID string) (string, string, error) {
	stats, err := s.workoutService.GetIndividualExerciseStats(ctx, userID)
	if err != nil {
		return "", "", err
	}

	profile, _ := s.userService.GetProfile(ctx, userID)

	processedStats := buildProcessedStats(stats, profile)
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

	return CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
}

func buildProcessedCycle(cycle *workout.WorkoutCycle) []map[string]any {
	processedCycle := []map[string]any{}

	for _, workout := range cycle.Workouts {
		workoutMap := map[string]any{
			"workout_name": workout.Name,
			// "workout_date": workout.Date,
			"workout_completed": workout.Completed,
		}
		processedExercises := []map[string]any{}

		for _, we := range workout.WorkoutExercises {
			exerciseMap := map[string]any{
				"exercise_name":      we.IndividualExercise.Name,
				"exercise_sets_qty":  len(we.WorkoutSets),
				"exercise_completed": we.Completed,
			}
			processedExercises = append(processedExercises, exerciseMap)
		}

		if len(processedExercises) > 0 {
			workoutMap["exercises"] = processedExercises
		}
		processedCycle = append(processedCycle, workoutMap)
	}

	return processedCycle
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
		return CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	}

	currentCycle, _ := s.workoutService.GetWorkoutCycleByID(ctx, activePlan.CurrentCycleID)

	processedCycle := buildProcessedCycle(currentCycle)
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

	return CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
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

	return CallOpenAIChat(ctx, fullPrompt, previousResponseID, 256)
	// return fmt.Sprintf("General question: %s", question), fmt.Sprintf("previous_response_id: %s", previousResponseID), nil
}
