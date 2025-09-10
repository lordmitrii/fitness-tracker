package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type EmailHandler struct {
	svc usecase.EmailService
}

func NewEmailHandler(r *gin.RouterGroup, svc usecase.EmailService, rateLimiter usecase.RateLimiter, rbacService usecase.RBACService) {
	h := &EmailHandler{svc: svc}

	email := r.Group("/email")
	email.Use(middleware.RateLimitMiddleware(rateLimiter, 10, "email")) // 10 requests per minute

	{
		email.POST("/validate-token", h.ValidateToken)

		email.POST("/send-reset-password", h.SendResetPasswordEmail)
		email.POST("/reset-password", h.ResetPassword)
		email.POST("/send-account-verification", h.SendVerificationEmail)
		email.POST("/verify-account", h.VerifyAccount)

		protected := email.Group("/")
		protected.Use(middleware.JWTMiddleware())
		{
			// protected.POST("/send-account-verification", h.SendVerificationEmail)
			// protected.POST("/verify-account", h.VerifyAccount)

			adminonly := protected.Group("")
			adminonly.Use(middleware.RequirePerm(rbacService, rbac.PermAdmin))
			{
				adminonly.POST("/send-notification", h.SendNotificationEmail)
			}
		}

	}
}

func (h *EmailHandler) SendVerificationEmail(c *gin.Context) {
	var req dto.SendVerificationEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendVerificationEmail(c.Request.Context(), req.To, req.Language); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Verification email sent"})
}

func (h *EmailHandler) SendNotificationEmail(c *gin.Context) {
	var req dto.SendNotificationEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendNotificationEmail(c.Request.Context(), req.To, req.Subject, req.Body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Notification email sent"})
}

func (h *EmailHandler) SendResetPasswordEmail(c *gin.Context) {
	var req dto.SendResetPasswordEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SendResetPasswordEmail(c.Request.Context(), req.To, req.Language); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Reset password email sent"})
}

func (h *EmailHandler) ValidateToken(c *gin.Context) {
	var req dto.ValidateTokenRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	valid, err := h.svc.ValidateToken(c.Request.Context(), req.Token, req.TokenType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !valid {
		c.JSON(http.StatusUnauthorized, dto.MessageResponse{Message: "Invalid or expired token"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Token is valid"})
}

func (h *EmailHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.ResetPassword(c.Request.Context(), req.Token, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Password reset successfully"})
}

func (h *EmailHandler) VerifyAccount(c *gin.Context) {
	var req dto.VerifyAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.VerifyAccount(c.Request.Context(), req.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Account verified successfully"})
}
