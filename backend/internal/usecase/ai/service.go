package ai

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/ai"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type aiServiceImpl struct {
	workoutService  usecase.WorkoutService
	exerciseService usecase.ExerciseService
	userService     usecase.UserService
	openai          ai.OpenAI
}

func NewAIService(
	workoutService usecase.WorkoutService,
	exerciseService usecase.ExerciseService,
	userService usecase.UserService,
	openai ai.OpenAI,
) usecase.AIService {
	return &aiServiceImpl{
		workoutService:  workoutService,
		exerciseService: exerciseService,
		userService:    userService,
		openai:         openai,
	}
}
