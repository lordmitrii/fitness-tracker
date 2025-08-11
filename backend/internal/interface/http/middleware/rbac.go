package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"net/http"
)

func RequirePerm(rbacService usecase.RBACService, permKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")
		ok, err := rbacService.HasPermission(c.Request.Context(), userID, permKey)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			return
		}
		c.Next()
	}
}

func RequireRole(rbacService usecase.RBACService, roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")
		ok, err := rbacService.HasRole(c.Request.Context(), userID, roleName)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient roles"})
			return
		}
		c.Next()
	}
}
