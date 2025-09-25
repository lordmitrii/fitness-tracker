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
