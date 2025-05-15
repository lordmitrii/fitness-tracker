package handler

import (
	"net/http"
	// "strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
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

        protected := us.Group("/")
        protected.Use(middleware.JWTMiddleware())
        {
            protected.POST("/profile", h.CreateProfile)
            protected.GET("/profile", h.GetProfile)
            protected.PUT("/profile", h.UpdateProfile)
            protected.DELETE("/profile", h.DeleteProfile)
        }
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
    var req struct { 
        Email     string   `binding:"required,email"` 
        Password  string   `binding:"required,min=8"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }
    if err := h.svc.Register(c.Request.Context(), req.Email, req.Password); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
    }
    c.Status(http.StatusCreated)
}

func (h *UserHandler) Login(c *gin.Context) {
    var req struct { 
        Email     string   `binding:"required,email"` 
        Password  string   `binding:"required,min=8"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }
    user, err := h.svc.Authenticate(c.Request.Context(), req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"}); return
    }

    token, err := middleware.GenerateToken(user.ID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"}); return
    }
    c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    } 
    uid := userID.(uint)
    p, err := h.svc.GetProfile(c.Request.Context(), uid)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"}); return
    }
    c.JSON(http.StatusOK, p)
}

func (h *UserHandler) CreateProfile(c *gin.Context) {
    var req user.Profile

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }

    userID, exists := c.Get("userID")
    if !exists {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    } 
    uid := userID.(uint)
    req.UserID = uid

    if err := h.svc.CreateProfile(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
    }
    c.JSON(http.StatusCreated, req)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
    var req user.Profile

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return
    }

    userID, exists := c.Get("userID")
    if !exists {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    } 
    uid := userID.(uint)
    req.UserID = uid
    // TODO: fix this cause retrieves it check inside by id not by userID
    if err := h.svc.UpdateProfile(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
    }
    c.JSON(http.StatusOK, req)
}

func (h *UserHandler) DeleteProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
    if !exists {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    } 
    uid := userID.(uint)

	if err := h.svc.DeleteProfile(c.Request.Context(), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return
	}
	c.Status(http.StatusNoContent)
}