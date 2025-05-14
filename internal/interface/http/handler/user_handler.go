package handler

import (
	"net/http"
	// "strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type UserHandler struct {
    svc usecase.UserService
}

// NewUserHandler instantiates the handler and sets up the routes
func NewUserHandler(r *gin.RouterGroup, svc usecase.UserService) {
    h := &UserHandler{svc: svc}
    us := r.Group("/users")
    {
		us.POST("/register", h.Register)
		us.POST("/login", h.Login)
		us.GET("/profile", h.GetProfile)
		us.PUT("/profile", h.UpdateProfile)
		us.DELETE("/profile", h.DeleteProfile)
    }
}
// RegisterUser godoc
// @Summary      Register a new user
// @Description  create a user record
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        user  body      user.User  true  "User payload"
// @Success      201      {object}  user.User
// @Failure      400      {object}  handler.ErrorResponse
// @Failure      500      {object}  handler.ErrorResponse
// @Router       /users [post]
func (h *UserHandler) Register(c *gin.Context) {
    var req struct { Email, Password string }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }
    if err := h.svc.Register(c.Request.Context(), req.Email, req.Password); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
    }
    c.Status(http.StatusCreated)
}

func (h *UserHandler) Login(c *gin.Context) {
    var req struct { Email, Password string }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }
    user, err := h.svc.Authenticate(c.Request.Context(), req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"}); return
    }
    // TODO: issue JWT
    c.JSON(http.StatusOK, gin.H{"user_id": user.ID})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
    // TODO: extract userID from JWT
    userID := uint(1)
    p, err := h.svc.GetProfile(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"}); return
    }
    c.JSON(http.StatusOK, p)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
    userID := uint(1)
    var req user.Profile
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }
    req.UserID = userID
    if err := h.svc.UpdateProfile(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
    }
    c.JSON(http.StatusOK, req)
}

func (h *UserHandler) DeleteProfile(c *gin.Context) {
	userID := uint(1)
	if err := h.svc.DeleteProfile(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
	}
	c.Status(http.StatusNoContent)
}