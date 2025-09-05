package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type AdminHandler struct {
	svc usecase.AdminService
}

func NewAdminHandler(r *gin.RouterGroup, svc usecase.AdminService, rbacService usecase.RBACService) {
	h := &AdminHandler{svc: svc}

	admin := r.Group("/admin")
	admin.Use(middleware.JWTMiddleware())
	admin.Use(middleware.RequirePerm(rbacService, rbac.PermAdmin))

	{
		admin.GET("/users", h.GetUsers)
		admin.GET("/roles", h.GetRoles)
		admin.POST("/users/:id/roles", h.SetUserRoles)
		admin.POST("/users/:id/password-reset", h.TriggerResetUserPassword)
		admin.DELETE("/users/:id", h.DeleteUser)
	}
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	page := parseInt(c.Query("page"), 1)
	pageSize := min(parseInt(c.Query("page_size"), 20), 200)
	sortBy := strings.TrimSpace(c.Query("sort_by"))
	sortDir := strings.TrimSpace(c.Query("sort_dir"))

	users, total, err := h.svc.ListUsers(c.Request.Context(), q, page, pageSize, sortBy, sortDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	respUsers := make([]dto.UserResponse, 0, len(users))
	for _, user := range users {
		respUsers = append(respUsers, dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			IsVerified: user.IsVerified,
			LastSeenAt: user.LastSeenAt,
			CreatedAt: user.CreatedAt,
			Roles:     dto.ToRoleResponses(user.Roles),
		})
	}

	c.JSON(http.StatusOK, dto.ListUserResponse{
		Users: respUsers,
		Total: total,
	})

}

func (h *AdminHandler) GetRoles(c *gin.Context) {
	roles, err := h.svc.ListRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	respRoles := make([]dto.RoleResponse, 0, len(roles))
	for _, role := range roles {
		respRoles = append(respRoles, dto.RoleResponse{
			ID:   role.ID,
			Name: role.Name,
		})
	}

	c.JSON(http.StatusOK, respRoles)
}

func (h *AdminHandler) SetUserRoles(c *gin.Context) {
	userID := parseUint(c.Param("id"), 0)
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	var req dto.SetRolesRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SetUserRoles(c.Request.Context(), userID, req.RoleNames); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userID := parseUint(c.Param("id"), 0)
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	if err := h.svc.DeleteUser(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AdminHandler) TriggerResetUserPassword(c *gin.Context) {
	userID := parseUint(c.Param("id"), 0)
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	if err := h.svc.TriggerResetUserPassword(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
