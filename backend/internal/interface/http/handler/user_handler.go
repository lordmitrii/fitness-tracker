package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type UserHandler struct {
	svc usecase.UserService
}

func NewUserHandler(r *gin.RouterGroup, svc usecase.UserService) {
	h := &UserHandler{svc: svc}
	us := r.Group("/users")
	{
		us.POST("/register", h.Register)
		us.POST("/login", h.Login)
		us.POST("/logout", h.Logout)
		us.POST("/refresh", h.RefreshToken)

		protected := us.Group("/")
		protected.Use(middleware.JWTMiddleware())
		{
			protected.GET("/me", h.Me)

			protected.POST("/profile", h.CreateProfile)
			protected.GET("/profile", h.GetProfile)
			protected.PUT("/profile", h.UpdateProfile)
			protected.DELETE("/profile", h.DeleteProfile)

			protected.GET("/consents", h.GetConsents)
			protected.POST("/consents", h.CreateConsent)
			protected.DELETE("/consents", h.DeleteConsent)
		}
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !req.PrivacyConsent || !req.HealthDataConsent {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "consent for privacy or health data policy is not given",
		})
		return
	}

	if err := h.svc.Register(c.Request.Context(), req.Email, req.Password, req.PrivacyConsent, req.HealthDataConsent, req.PrivacyPolicyVersion, req.HealthDataPolicyVersion); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}

func (h *UserHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.svc.Authenticate(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	accessToken, err := middleware.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate refresh token"})
		return
	}

	c.SetCookie("refresh_token", refreshToken, 60*60*24*7, "/", "", false, true)
	c.JSON(http.StatusOK, dto.TokenResponse{AccessToken: accessToken})
}

func (h *UserHandler) Logout(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "logged out"})
}

func (h *UserHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token missing"})
		return
	}

	tok, err := jwt.ParseWithClaims(refreshToken, &middleware.Claims{}, func(t *jwt.Token) (any, error) {
		return middleware.JwtSecret(), nil
	})
	if err != nil || !tok.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	claims := tok.Claims.(*middleware.Claims)
	accessToken, err := middleware.GenerateToken(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}
	c.JSON(http.StatusOK, dto.TokenResponse{AccessToken: accessToken})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}
	p, err := h.svc.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToProfileResponse(p))
}

func (h *UserHandler) CreateProfile(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ProfileCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := &user.Profile{
		UserID:   userID,
		Age:      req.Age,
		HeightCm: req.HeightCm,
		WeightKg: req.WeightKg,
		Sex:      req.Sex,
	}

	if err := h.svc.CreateProfile(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToProfileResponse(p))
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := &user.Profile{
		UserID:   userID,
		Age:      req.Age,
		HeightCm: req.HeightCm,
		WeightKg: req.WeightKg,
		Sex:      req.Sex,
	}

	if err := h.svc.UpdateProfile(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToProfileResponse(p))
}

func (h *UserHandler) DeleteProfile(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	if err := h.svc.DeleteProfile(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *UserHandler) GetConsents(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	consents, err := h.svc.GetConsents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]dto.ConsentResponse, 0, len(consents))
	for _, cns := range consents {
		resp = append(resp, dto.ToConsentResponse(cns))
	}

	c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) CreateConsent(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cns := &user.UserConsent{
		UserID:  userID,
		Type:    req.Type,
		Version: req.Version,
		Given:   req.Given,
	}

	if err := h.svc.CreateConsent(c.Request.Context(), cns); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToConsentResponse(cns))
}

func (h *UserHandler) UpdateConsent(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cns := &user.UserConsent{
		UserID:  userID,
		Type:    req.Type,
		Version: req.Version,
		Given:   req.Given,
	}

	if err := h.svc.UpdateConsent(c.Request.Context(), cns); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToConsentResponse(cns))
}

func (h *UserHandler) DeleteConsent(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.DeleteConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.DeleteConsent(c.Request.Context(), userID, req.Type, req.Version); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *UserHandler) Me(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	user, err := h.svc.Me(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.svc.TouchLastSeen(c.Request.Context(), userID)

	resp := dto.MeResponse{
		Email:      user.Email,
		Roles:      dto.ToRoleResponses(user.Roles),
		IsVerified: user.IsVerified,
	}

	c.JSON(http.StatusOK, resp)
}
