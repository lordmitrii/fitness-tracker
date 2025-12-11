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
	if inm == "" || etag == "" {
		return false
	}
	strip := func(s string) string {
		s = strings.TrimSpace(s)
		s = strings.TrimPrefix(s, "W/")
		return strings.Trim(s, `"`)
	}
	a := strip(etag)
	for _, part := range strings.Split(inm, ",") {
		p := strip(part)
		if p == "*" || p == a {
			return true
		}
	}
	return false
}
