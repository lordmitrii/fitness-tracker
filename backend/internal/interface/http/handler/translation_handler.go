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
