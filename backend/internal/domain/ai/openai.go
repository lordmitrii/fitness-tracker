package ai

import (
	"context"
)

type OpenAI interface {
	CallOpenAIChat(ctx context.Context, input string, previousResponseID string, maxTokens int64) (string, string, error)
}