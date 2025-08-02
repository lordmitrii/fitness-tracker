package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type AIHandler struct {
	svc usecase.AIService
}

func NewAIHandler(r *gin.RouterGroup, svc usecase.AIService) {
	h := &AIHandler{svc: svc}
	auth := r.Group("")
	auth.Use(middleware.JWTMiddleware())

	ai := auth.Group("/ai")
	{
		ai.POST("/ask-stats", h.AskStatsQuestion)
	}
}

func (h *AIHandler) AskStatsQuestion(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		Question          string `json:"question"`
		PreviousResponseID string `json:"previous_response_id"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, prevRespID, err := h.svc.AskStatsQuestion(c.Request.Context(), userID.(uint), req.Question, req.PreviousResponseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": resp, "response_id": prevRespID})
}
