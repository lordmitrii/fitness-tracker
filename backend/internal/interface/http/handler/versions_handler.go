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

// GetCurrentVersion godoc
// @Summary      Get current version by key
// @Tags         versions
// @Produce      json
// @Param        key  path   string  true  "Version key"  example(mobile_app)
// @Success      200  {object}  dto.VersionResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /versions/{key} [get]
func (h *VersionsHandler) GetCurrentVersion(c *gin.Context) {
	key := c.Param("key")
	version, err := h.svc.GetCurrentVersion(c.Request.Context(), key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToVersionsResponse(version))
}

// GetAllVersions godoc
// @Summary      List all versions
// @Tags         versions
// @Produce      json
// @Success      200  {array}   dto.VersionResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /versions [get]
func (h *VersionsHandler) GetAllVersions(c *gin.Context) {
	versions, err := h.svc.GetAllVersions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToVersionsMultipleResponse(versions))
}
