package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
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

func etagMatch(inm, etag string) bool {
  parts := strings.Split(inm, ",")
  strip := func(s string) string { return strings.TrimSpace(strings.Trim(s, `"`)) }
  a := strip(strings.TrimPrefix(etag, "W/"))
  for _, p := range parts {
    b := strip(strings.TrimPrefix(p, "W/"))
    if b == "*" || b == a {
      return true
    }
  }
  return false
}