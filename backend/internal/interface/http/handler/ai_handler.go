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
	}
}

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
