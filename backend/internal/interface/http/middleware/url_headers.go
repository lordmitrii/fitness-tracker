package middleware

import "github.com/gin-gonic/gin"

func DebugHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		if route := c.FullPath(); route != "" {
			c.Header("X-Route-Pattern", route)
		}
		c.Header("X-HTTP-Method", c.Request.Method)

		if label := c.GetHeader("X-Debug-Label"); label != "" {
			c.Header("X-Debug-Label", label)
		}
		c.Next()
	}
}
