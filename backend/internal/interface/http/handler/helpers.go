package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

func currentUserID(c *gin.Context) (uint, bool) {
	v, exists := c.Get("userID")
	if !exists {
		c.AbortWithStatus(http.StatusUnauthorized)
		return 0, false
	}
	return v.(uint), true
}

func parseUint(s string, def uint) uint {
	if s == "" {
		return def
	}
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return def
	}
	return uint(n)
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
