package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type VersionsHandler struct {
	svc usecase.VersionsService
}

func NewVersionsHandler(r *gin.RouterGroup, svc usecase.VersionsService) {
	h := &VersionsHandler{svc: svc}
	group := r.Group("/versions")
	{
		group.GET("/:key", h.GetCurrentVersion)
		group.GET("/", h.GetAllVersions)
	}
}

func (h *VersionsHandler) GetCurrentVersion(c *gin.Context) {
	key := c.Param("key")
	version, err := h.svc.GetCurrentVersion(c.Request.Context(), key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToVersionsResponse(version))
}

func (h *VersionsHandler) GetAllVersions(c *gin.Context) {
	versions, err := h.svc.GetAllVersions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToVersionsMultipleResponse(versions))
}
