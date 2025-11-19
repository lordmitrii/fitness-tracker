package ai

import (
	"context"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

type OpenAI interface {
	CallOpenAIChat(ctx context.Context, input string, previousResponseID string, maxTokens int64) (string, string, error)
	GenerateWorkoutPlan(ctx context.Context, prompt string, exercises []*workout.Exercise, maxTokens int64) (*workout.WorkoutPlan, error)
	GenerateWorkoutPlanWithDB(
		ctx context.Context,
		prompt string,
		maxTokens int64,
		listMuscleGroups func(ctx context.Context, limit int) ([]string, error),
		searchExercises func(ctx context.Context, groupQuery string, limit, offset int) ([]map[string]any, error),
	) (*workout.WorkoutPlan, error)
}
