package dto

type AIQuestionRequest struct {
	Question           string `json:"question" binding:"required"`
	PreviousResponseID string `json:"previous_response_id"`
}

type AIQuestionResponse struct {
	Answer     string `json:"answer"`
	ResponseID string `json:"response_id"`
}
