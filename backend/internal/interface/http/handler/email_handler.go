package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type EmailHandler struct {
	svc usecase.EmailService
}

func NewEmailHandler(r *gin.RouterGroup, svc usecase.EmailService) {
	h := &EmailHandler{svc: svc}
	auth := r.Group("")
	auth.Use(middleware.JWTMiddleware())

	email := auth.Group("/email")
	{
		email.POST("/send-verification", h.SendVerificationEmail)
		email.POST("/send-notification", h.SendNotificationEmail)
		email.POST("/send-reset-password", h.SendResetPasswordEmail)
		email.POST("/verify-token", h.VerifyToken)
	}
}

func (h *EmailHandler) SendVerificationEmail(c *gin.Context) {
	var req struct {
		To string `json:"to" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendVerificationEmail(c.Request.Context(), req.To); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Verification email sent"})
}

func (h *EmailHandler) SendNotificationEmail(c *gin.Context) {
	var req struct {
		To      string `json:"to" binding:"required,email"`
		Subject string `json:"subject" binding:"required"`
		Body    string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendNotificationEmail(c.Request.Context(), req.To, req.Subject, req.Body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Notification email sent"})
}

func (h *EmailHandler) SendResetPasswordEmail(c *gin.Context) {
	var req struct {
		To string `json:"to" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendResetPasswordEmail(c.Request.Context(), req.To); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Reset password email sent"})
}

func (h *EmailHandler) VerifyToken(c *gin.Context) {
	var req struct {
		Token     string `json:"token" binding:"required"`
		TokenType string `json:"token_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	valid, err := h.svc.VerifyToken(c.Request.Context(), req.Token, req.TokenType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Token is valid"})
}
