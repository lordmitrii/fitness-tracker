package ai

import (
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type aiServiceImpl struct {
	workoutService usecase.WorkoutService
	userService    usecase.UserService
}

func NewAIService(
	workoutService usecase.WorkoutService,
	userService usecase.UserService,
) *aiServiceImpl {
	return &aiServiceImpl{
		workoutService: workoutService,
		userService:    userService,
	}
}
