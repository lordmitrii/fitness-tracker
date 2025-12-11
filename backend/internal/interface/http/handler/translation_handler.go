package handler

import (
	"crypto/sha1"
	"encoding/hex"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type TranslationHandler struct {
	svc usecase.TranslationService
}

func NewTranslationHandler(r *gin.RouterGroup, svc usecase.TranslationService) {
	h := &TranslationHandler{svc: svc}
	group := r.Group("/i18n")
	{
		group.GET("/:locale/:namespace", h.GetTranslations)
		group.POST("/missing", h.ReportMissingTranslation)
		group.POST("/missing/batch", h.ReportMissingTranslationBatch)
		group.GET("/meta", h.GetI18nMeta)

		adminonly := group.Group("/")
		adminonly.Use(middleware.JWTMiddleware())
		{
			adminonly.POST("", h.CreateTranslation)
			adminonly.PATCH("/:id", h.UpdateTranslation)
			adminonly.DELETE("/:id", h.DeleteTranslation)
		}
	}
}

// GetTranslations godoc
// @Summary      Get translations map
// @Description  Returns a key->value map for a given locale and namespace. Supports ETag caching.
// @Tags         translations
// @Accept       json
// @Produce      json
// @Param        locale     path      string  true  "Locale code"     example(en)
// @Param        namespace  path      string  true  "Namespace"        example(common)
// @Success      200  {object}  map[string]string
// @Header       200  {string}  ETag  "Weak ETag for cache validation"
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/{locale}/{namespace} [get]
func (h *TranslationHandler) GetTranslations(c *gin.Context) {
	ns := c.Param("namespace")
	lng := c.Param("locale")

	rows, err := h.svc.GetTranslations(c.Request.Context(), ns, lng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make(map[string]string, len(rows))
	for _, t := range rows {
		resp[t.Key] = t.Value
	}

	keys := make([]string, 0, len(resp))
	for k := range resp {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	hsh := sha1.New()
	for _, k := range keys {
		hsh.Write([]byte(k))
		hsh.Write([]byte{0})
		hsh.Write([]byte(resp[k]))
		hsh.Write([]byte{0})
	}
	etag := `W/"` + hex.EncodeToString(hsh.Sum(nil)) + `"`

	inm := c.GetHeader("If-None-Match")
	if inm != "" && etagMatch(inm, etag) {
		c.Status(http.StatusNotModified)
		return
	}

	c.Header("ETag", etag)
	// c.Header("Cache-Control", "public, max-age=300, stale-while-revalidate=86400")
	c.JSON(http.StatusOK, resp)
}

// GetI18nMeta godoc
// @Summary      Get i18n metadata (versions)
// @Description  Returns version strings for locales/namespaces to enable client-side caching. Supports ETag caching.
// @Tags         translations
// @Accept       json
// @Produce      json
// @Param        locales     query     string  false  "Comma-separated locales filter"     example(en,de,fr)
// @Param        namespaces  query     string  false  "Comma-separated namespaces filter"  example(common,errors)
// @Success      200  {object}  dto.I18nMetaResponse
// @Header       200  {string}  ETag  "Weak ETag for cache validation"
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/meta [get]
func (h *TranslationHandler) GetI18nMeta(c *gin.Context) {
	locales := c.Query("locales")
	namespaces := c.Query("namespaces")

	vers, err := h.svc.GetI18nMeta(c.Request.Context(), locales, namespaces)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	locs := make([]string, 0, len(vers))
	for k := range vers {
		locs = append(locs, k)
	}
	sort.Strings(locs)

	hsh := sha1.New()
	for _, loc := range locs {
		hsh.Write([]byte(loc))
		hsh.Write([]byte{0})
		nsKeys := make([]string, 0, len(vers[loc]))
		for ns := range vers[loc] {
			nsKeys = append(nsKeys, ns)
		}
		sort.Strings(nsKeys)
		for _, ns := range nsKeys {
			hsh.Write([]byte(ns))
			hsh.Write([]byte{0})
			hsh.Write([]byte(vers[loc][ns]))
			hsh.Write([]byte{0})
		}
	}
	etag := `W/"` + hex.EncodeToString(hsh.Sum(nil)) + `"`

	if inm := c.GetHeader("If-None-Match"); inm != "" && etagMatch(inm, etag) {
		c.Status(http.StatusNotModified)
		return
	}

	c.Header("ETag", etag)
	// c.Header("Cache-Control", "public, max-age=0, must-revalidate")

	c.JSON(http.StatusOK, gin.H{"versions": vers})
}

// ReportMissingTranslation godoc
// @Summary      Report a missing translation
// @Description  Publishes a missing translation entry for all provided languages.
// @Tags         translations
// @Accept       json
// @Produce      json
// @Param        body  body      dto.MissingTranslationsReportRequest  true  "Missing translation payload"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/missing [post]
func (h *TranslationHandler) ReportMissingTranslation(c *gin.Context) {
	var req dto.MissingTranslationsReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]*translations.MissingTranslation, 0, len(req.Languages))
	for _, lang := range req.Languages {
		items = append(items, &translations.MissingTranslation{
			Namespace: req.Namespace,
			Locale:    lang,
			Key:       req.Key,
		})
	}

	if err := h.svc.ReportMissingTranslations(c.Request.Context(), items); err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// ReportMissingTranslationBatch godoc
// @Summary      Report multiple missing translations
// @Tags         translations
// @Accept       json
// @Produce      json
// @Param        body  body      dto.MissingTranslationsReportBatchRequest  true  "Batch of missing translations"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/missing/batch [post]
func (h *TranslationHandler) ReportMissingTranslationBatch(c *gin.Context) {
	var req dto.MissingTranslationsReportBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]*translations.MissingTranslation, 0, len(req.Items))
	for _, item := range req.Items {
		for _, lang := range item.Languages {
			items = append(items, &translations.MissingTranslation{
				Namespace: item.Namespace,
				Locale:    lang,
				Key:       item.Key,
			})
		}
	}

	if err := h.svc.ReportMissingTranslations(c.Request.Context(), items); err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// CreateTranslation godoc
// @Summary      Create translation (admin)
// @Tags         translations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateTranslationRequest  true  "Create translation payload"
// @Success      201  {object}  dto.TranslationResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n [post]
func (h *TranslationHandler) CreateTranslation(c *gin.Context) {
	var req dto.CreateTranslationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	translation := &translations.Translation{
		Namespace: req.Namespace,
		Locale:    req.Locale,
		Key:       req.Key,
		Value:     req.Value,
	}

	if err := h.svc.CreateTranslation(c.Request.Context(), translation); err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusCreated, dto.ToTranslationResponse(translation))
}

// UpdateTranslation godoc
// @Summary      Update translation (admin)
// @Tags         translations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      uint                         true  "Translation ID"
// @Param        body  body      dto.UpdateTranslationRequest true  "Fields to update"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/{id} [patch]
func (h *TranslationHandler) UpdateTranslation(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Translation ID is required"})
		return
	}
	var req dto.UpdateTranslationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	if err := h.svc.UpdateTranslation(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// DeleteTranslation godoc
// @Summary      Delete translation (admin)
// @Tags         translations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id  path      uint  true  "Translation ID"
// @Success      204  {string}  string  "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      403  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /i18n/{id} [delete]
func (h *TranslationHandler) DeleteTranslation(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Translation ID is required"})
		return
	}

	if err := h.svc.DeleteTranslation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusNoContent)
}
