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

// Register godoc
// @Summary      Register a new user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      dto.RegisterRequest  true  "Registration payload"
// @Success      201   {string}  string               "Created"
// @Failure      400   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/register [post]
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

// Login godoc
// @Summary      Login with username/password
// @Description  Returns an access token in JSON and sets a refresh token cookie.
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      dto.LoginRequest   true  "Credentials"
// @Success      200   {object}  dto.TokenResponse
// @Header       200   {string}  Set-Cookie  "refresh_token cookie (HttpOnly)"
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse "Invalid credentials"
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/login [post]
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
	c.JSON(http.StatusOK, dto.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// Logout godoc
// @Summary      Logout
// @Description  Clears the refresh token cookie.
// @Tags         users
// @Produce      json
// @Success      200  {object}  dto.MessageResponse
// @Header       200  {string}  Set-Cookie  "refresh_token cleared"
// @Router       /users/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "logged out"})
}

// RefreshToken godoc
// @Summary      Refresh access token
// @Description  Reads refresh token cookie and returns a new access token.
// @Tags         users
// @Produce      json
// @Success      200  {object}  dto.TokenResponse
// @Failure      401  {object}  dto.MessageResponse "Missing or invalid refresh token"
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/refresh [post]
func (h *UserHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		var body dto.RefreshRequest
		if bindErr := c.ShouldBindJSON(&body); bindErr == nil && body.RefreshToken != "" {
			refreshToken = body.RefreshToken
		}
	}
	if refreshToken == "" {
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

	newRefresh, err := middleware.GenerateRefreshToken(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate refresh token"})
		return
	}
	c.SetCookie("refresh_token", newRefresh, 60*60*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, dto.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefresh,
	})
}

// GetProfile godoc
// @Summary      Get profile
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  dto.ProfileResponse
// @Success      204  {string}  string "No Content when profile is empty"
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse "Profile not found"
// @Router       /users/profile [get]
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

// UpdateAccount godoc
// @Summary      Update account fields
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.AccountUpdateRequest  true  "Fields to update"
// @Success      200   {object}  dto.AccountResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/accounts [patch]
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

// CreateProfile godoc
// @Summary      Create profile
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.ProfileCreateRequest  true  "Profile payload"
// @Success      201   {object}  dto.ProfileResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/profile [post]
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

// UpdateProfile godoc
// @Summary      Update profile
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.ProfileUpdateRequest  true  "Fields to update"
// @Success      200   {object}  dto.ProfileResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/profile [put]
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

// DeleteProfile godoc
// @Summary      Delete profile
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      204  {string}  string "No Content"
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/profile [delete]
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

// GetConsents godoc
// @Summary      List consents
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   dto.ConsentResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/consents [get]
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

// CreateConsent godoc
// @Summary      Create consent
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.ConsentRequest  true  "Consent payload"
// @Success      201   {object}  dto.ConsentResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/consents [post]
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

// UpdateConsent godoc
// @Summary      Update consent
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.ConsentRequest  true  "Fields to update"
// @Success      200   {object}  dto.ConsentResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/consents [put]
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

// DeleteConsent godoc
// @Summary      Delete consent
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.DeleteConsentRequest  true  "Consent to delete"
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/consents [delete]
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

// Me godoc
// @Summary      Get current user info
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  dto.MeResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/me [get]
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

// GetUserSettings godoc
// @Summary      Get user settings
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  dto.UserSettingsResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/settings [get]
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

// UpdateUserSettings godoc
// @Summary      Update user settings
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.UserSettingsUpdateRequest  true  "Fields to update"
// @Success      200   {object}  dto.UserSettingsResponse
// @Success      204   {string}  string "No Content when no changes"
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/settings [patch]
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

// CreateUserSettings godoc
// @Summary      Create user settings
// @Tags         users
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.UserSettingsCreateRequest  true  "Settings payload"
// @Success      201   {object}  dto.UserSettingsResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /users/settings [post]
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

// DeleteUserSettings godoc
// @Summary      Delete user settings
// @Tags         users
// @Security     BearerAuth
// @Produce      json
// @Success      204  {string}  string "No Content"
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /users/settings [delete]
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
