package ai

import (
	"context"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/ai"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/responses"
)

type OpenAI struct {
	APIKey      string
	Temperature float64
}

func NewOpenAI(apiKey string, temperature float64) ai.OpenAI {
	return &OpenAI{
		APIKey:      apiKey,
		Temperature: temperature,
	}
}

func (o *OpenAI) CallOpenAIChat(ctx context.Context, input string, previousResponseID string, maxTokens int64) (string, string, error) {
	if o.APIKey == "" {
		return "", "", fmt.Errorf("api key not set for OpenAI")
	}

	client := openai.NewClient(option.WithAPIKey(o.APIKey))

	params := responses.ResponseNewParams{
		Model:           openai.ChatModelGPT4_1Nano2025_04_14,
		Temperature:     openai.Float(o.Temperature),
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
