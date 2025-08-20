package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/responses"
)

func callOpenAIChat(ctx context.Context, input string, previousResponseID string, maxTokens int64) (string, string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", "", fmt.Errorf("OPENAI_API_KEY not set")
	}

	client := openai.NewClient(option.WithAPIKey(apiKey))

	params := responses.ResponseNewParams{
		Model:           openai.ChatModelGPT4_1Nano2025_04_14,
		Temperature:     openai.Float(1.0),
		MaxOutputTokens: openai.Int(maxTokens),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(input),
		},
		Instructions: openai.String("You are a pro fitness assistant who answers user questions. Your answers should be concise, relevant, and not emotional."),
		Store:        openai.Bool(true),
	}

	if previousResponseID != "" {
		params.PreviousResponseID = openai.String(previousResponseID)
	}

	resp, err := client.Responses.New(ctx, params)
	if err != nil {
		return "", "", fmt.Errorf("failed to call OpenAI API: %w", err)
	}

	return resp.OutputText(), resp.ID, nil
}
