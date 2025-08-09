package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

func RateLimitMiddleware(limiter usecase.RateLimiter, perMinute int, scope string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}

		var who string
		if v, exists := c.Get("userID"); exists {
			who = fmt.Sprintf("user:%v", v)
		} else {
			who = fmt.Sprintf("ip:%s", c.ClientIP())
		}

		key := fmt.Sprintf("rl:%s:%s", scope, who)

		allowed, retryAfter, err := limiter.Allow(c.Request.Context(), key, perMinute, time.Minute)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit error"})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		c.Next()
	}
}
