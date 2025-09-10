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
			protected.PATCH("/accounts", h.UpdateAccount)

			protected.POST("/profile", h.CreateProfile)
			protected.GET("/profile", h.GetProfile)
			protected.PUT("/profile", h.UpdateProfile)
			protected.DELETE("/profile", h.DeleteProfile)

			protected.GET("/consents", h.GetConsents)
			protected.POST("/consents", h.CreateConsent)
			protected.DELETE("/consents", h.DeleteConsent)

			protected.GET("/settings", h.GetUserSettings)
			protected.PATCH("/settings", h.UpdateUserSettings)
			protected.POST("/settings", h.CreateUserSettings)
			protected.DELETE("/settings", h.DeleteUserSettings)
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

	if err := h.svc.Register(c.Request.Context(), req.Username, req.Email, req.Password, req.PrivacyConsent, req.HealthDataConsent, req.PrivacyPolicyVersion, req.HealthDataPolicyVersion); err != nil {
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
	user, err := h.svc.Authenticate(c.Request.Context(), req.Username, req.Password)
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
	if p == nil {
		c.Status(http.StatusNoContent)
		return
	}
	c.JSON(http.StatusOK, dto.ToProfileResponse(p))
}

func (h *UserHandler) UpdateAccount(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.AccountUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)
	
	account, err := h.svc.UpdateAccount(c.Request.Context(), userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToAccountResponse(account))
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
		UserID: userID,
		Age:    req.Age,
		Height: req.Height,
		Weight: req.Weight,
		Sex:    req.Sex,
	}

	if err := h.svc.CreateProfile(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToProfileResponse(p))
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	id, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	p, err := h.svc.UpdateProfile(c.Request.Context(), id, updates)
	if err != nil {
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
	id, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.ConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	consent, err := h.svc.UpdateConsent(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToConsentResponse(consent))
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
		Username:   user.Username,
		Email:      user.Email,
		Roles:      dto.ToRoleResponses(user.Roles),
		IsVerified: user.IsVerified,
	}

	c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) GetUserSettings(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	settings, err := h.svc.GetUserSettings(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToUserSettingsResponse(settings))
}

func (h *UserHandler) UpdateUserSettings(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.UserSettingsUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)
	if len(updates) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	settings, err := h.svc.UpdateUserSettings(c.Request.Context(), userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToUserSettingsResponse(settings))
}

func (h *UserHandler) CreateUserSettings(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.UserSettingsCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings := &user.UserSettings{
		UserID:             userID,
		UnitSystem:         req.UnitSystem,
		BetaOptIn:          req.BetaOptIn,
		EmailNotifications: req.EmailNotifications,
	}

	if err := h.svc.CreateUserSettings(c.Request.Context(), settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToUserSettingsResponse(settings))
}

func (h *UserHandler) DeleteUserSettings(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	if err := h.svc.DeleteUserSettings(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
