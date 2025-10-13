package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type AIHandler struct {
	svc usecase.AIService
}

func NewAIHandler(r *gin.RouterGroup, svc usecase.AIService, rateLimiter usecase.RateLimiter, rbacService usecase.RBACService) {
	h := &AIHandler{svc: svc}

	ai := r.Group("/ai")
	ai.Use(middleware.JWTMiddleware())
	ai.Use(middleware.RateLimitMiddleware(rateLimiter, 3, "ai")) // 3 requests per minute
	ai.Use(middleware.RequirePerm(rbacService, rbac.PermAiQuestions))

	{
		ai.POST("/ask-general", h.AskGeneralQuestion)
		ai.POST("/ask-stats", h.AskStatsQuestion)
		ai.POST("/ask-workouts", h.AskWorkoutsQuestion)
		ai.POST("/generate-workout-plan", h.GenerateWorkoutPlan)
	}
}

// AskStatsQuestion godoc
// @Summary      Ask a stats-related question
// @Description  Lets the user ask AI about stats-related information.
// @Tags         ai
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.AIQuestionRequest  true  "Question payload"
// @Success      200   {object}  dto.AIQuestionResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      403   {object}  dto.MessageResponse
// @Failure      429   {object}  dto.MessageResponse  "Rate limited"
// @Failure      500   {object}  dto.MessageResponse
// @Router       /ai/ask-stats [post]
func (h *AIHandler) AskStatsQuestion(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.AIQuestionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, prevRespID, err := h.svc.AskStatsQuestion(c.Request.Context(), userID, req.Question, req.Language, req.PreviousResponseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.AIQuestionResponse{
		Answer:     resp,
		ResponseID: prevRespID,
	})
}

// AskWorkoutsQuestion godoc
// @Summary      Ask a workouts-related question
// @Description  Lets the user ask AI about workouts and training.
// @Tags         ai
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.AIQuestionRequest  true  "Question payload"
// @Success      200   {object}  dto.AIQuestionResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      403   {object}  dto.MessageResponse
// @Failure      429   {object}  dto.MessageResponse  "Rate limited"
// @Failure      500   {object}  dto.MessageResponse
// @Router       /ai/ask-workouts [post]
func (h *AIHandler) AskWorkoutsQuestion(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.AIQuestionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, prevRespID, err := h.svc.AskWorkoutsQuestion(c.Request.Context(), userID, req.Question, req.Language, req.PreviousResponseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.AIQuestionResponse{
		Answer:     resp,
		ResponseID: prevRespID,
	})
}

// AskGeneralQuestion godoc
// @Summary      Ask a general AI question
// @Description  Lets the user ask AI any general-purpose question.
// @Tags         ai
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.AIQuestionRequest  true  "Question payload"
// @Success      200   {object}  dto.AIQuestionResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      403   {object}  dto.MessageResponse
// @Failure      429   {object}  dto.MessageResponse  "Rate limited"
// @Failure      500   {object}  dto.MessageResponse
// @Router       /ai/ask-general [post]
func (h *AIHandler) AskGeneralQuestion(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.AIQuestionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, prevRespID, err := h.svc.AskGeneralQuestion(c.Request.Context(), userID, req.Question, req.Language, req.PreviousResponseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.AIQuestionResponse{
		Answer:     resp,
		ResponseID: prevRespID,
	})
}

// GenerateWorkoutPlan godoc
// @Summary      Generate a workout plan
// @Description  Generates a personalized workout plan based on user input.
// @Tags         ai
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.AIWorkoutPlanRequest  true  "Workout plan request payload"
// @Success      200   {object}  dto.AIWorkoutPlanResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      403   {object}  dto.MessageResponse
// @Failure      429   {object}  dto.MessageResponse  "Rate limited"
// @Failure      500   {object}  dto.MessageResponse
// @Router       /ai/generate-workout-plan [post]
func (h *AIHandler) GenerateWorkoutPlan(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.AIWorkoutPlanRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := h.svc.GenerateWorkoutPlan(c.Request.Context(), userID, req.Prompt, req.Days, req.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToAiWorkoutPlanResponse(plan))
}
