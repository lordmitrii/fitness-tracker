package dto

// swagger:model
type AIQuestionRequest struct {
	Question           string `json:"question" binding:"required,max=256" example:"What is the capital of France?"`
	Language           string `json:"language" example:"en"`
	PreviousResponseID string `json:"previous_response_id" example:"12345"`
}

// swagger:model
type AIQuestionResponse struct {
	Answer     string `json:"answer" example:"The capital of France is Paris."`
	ResponseID string `json:"response_id" example:"67890"`
}

// swagger:model
type AIWorkoutPlanRequest struct {
	Prompt   string `json:"prompt" binding:"required,max=512" example:"I want to build muscle and lose fat."`
	Language string `json:"language" example:"en"`
	Days     int    `json:"days_per_week" binding:"required,min=1,max=14" example:"4"`
}

// swagger:model
type AIWorkoutPlanResponse struct {
	Plan WorkoutPlanResponse `json:"workout_plan"`
}
