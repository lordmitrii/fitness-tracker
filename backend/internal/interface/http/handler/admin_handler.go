package handler

import (
	"net/http"
	"strings"

	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
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
		// admin.POST("/users/:id/roles", h.SetUserRole)
		// admin.POST("/users/:id/password-reset", h.ResetUserPassword)
		// admin.DELETE("/users/:id", h.DeleteUser)
	}
}

func (h *AdminHandler) GetUsers(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	page := parseInt(c.Query("page"), 1)
	pageSize := parseInt(c.Query("page_size"), 20)
	if pageSize > 200 {
		pageSize = 200
	}

	users, total, err := h.svc.ListUsers(c.Request.Context(), q, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	respUsers := make([]gin.H, 0, len(users))
	for _, user := range users {
		roleDTOs := make([]gin.H, 0, len(user.Roles))
		for _, role := range user.Roles {
			roleDTOs = append(roleDTOs, gin.H{
				"id":   role.ID,
				"name": role.Name,
			})
		}
		respUsers = append(respUsers, gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
			"roles":      roleDTOs,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users": respUsers,
		"total": total,
	})
}

func (h *AdminHandler) GetRoles(c *gin.Context) {
	roles, err := h.svc.ListRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	respRoles := make([]gin.H, 0, len(roles))
	for _, role := range roles {
		respRoles = append(respRoles, gin.H{
			"id":   role.ID,
			"name": role.Name,
		})
	}

	c.JSON(http.StatusOK, roles)
}

func parseInt(s string, def int64) int64 {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return int64(n)
}
