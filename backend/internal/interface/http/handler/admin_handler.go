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

// GetUsers godoc
// @Summary      List users (admin)
// @Description  Returns a paginated list of users with optional filtering and sorting.
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        q          query     string  false  "Free-text search on username/email"
// @Param        page       query     int     false  "Page number (1-based)"                 minimum(1) default(1)
// @Param        page_size  query     int     false  "Page size"                             minimum(1) maximum(200) default(20)
// @Param        sort_by    query     string  false  "Sort field"                            Enums(id,username,email,created_at,last_seen_at,is_verified)
// @Param        sort_dir   query     string  false  "Sort direction"                        Enums(asc,desc) default(desc)
// @Success      200  {object}  dto.ListUserResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /admin/users [get]
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
			Username:   user.Username,
			Email:      user.Email,
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

// GetRoles godoc
// @Summary      List roles (admin)
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Success      200  {array}   dto.RoleResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /admin/roles [get]
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


// SetUserRoles godoc
// @Summary      Set user roles (admin)
// @Description  Replaces the user's roles with the provided list of role names.
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      uint               true  "User ID"
// @Param        body  body      dto.SetRolesRequest true "New role names"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /admin/users/{id}/roles [post]
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

// DeleteUser godoc
// @Summary      Delete user (admin)
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id   path      uint  true  "User ID"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /admin/users/{id} [delete]
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

// TriggerResetUserPassword godoc
// @Summary      Trigger password reset (admin)
// @Description  Sends a password reset flow for the specified user.
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id   path      uint  true  "User ID"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /admin/users/{id}/password-reset [post]
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
