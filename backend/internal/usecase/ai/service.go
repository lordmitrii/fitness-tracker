package ai

import (
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/domain/ai"
)

type aiServiceImpl struct {
	workoutService usecase.WorkoutService
	userService    usecase.UserService
	openai         ai.OpenAI
}

func NewAIService(
	workoutService usecase.WorkoutService,
	userService usecase.UserService,
	openai ai.OpenAI,	
) *aiServiceImpl {
	return &aiServiceImpl{
		workoutService: workoutService,
		userService:    userService,
		openai:         openai,
	}
}
