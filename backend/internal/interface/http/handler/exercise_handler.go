package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type ExerciseHandler struct {
	svc usecase.ExerciseService
}

func NewExerciseHandler(r *gin.RouterGroup, svc usecase.ExerciseService, rbacService usecase.RBACService) {
	h := &ExerciseHandler{svc: svc}
	auth := r.Group("")
	auth.Use(middleware.JWTMiddleware())

	ex := auth.Group("/exercises")
	{
		ex.GET("/", h.GetAllExercises)
		ex.GET("/:id", h.GetExerciseByID)
		adminonly := ex.Group("")
		adminonly.Use(middleware.RequirePerm(rbacService, rbac.PermAdmin))
		{
			adminonly.POST("/", h.CreateExercise)
			adminonly.PATCH("/:id", h.UpdateExercise)
			adminonly.DELETE("/:id", h.DeleteExercise)
		}
	}

	mg := auth.Group("/muscle-groups")
	{
		mg.GET("/", h.GetAllMuscleGroups)
		mg.GET("/:id", h.GetMuscleGroupByID)
		adminonly := mg.Group("")
		adminonly.Use(middleware.RequirePerm(rbacService, rbac.PermAdmin))
		{
			adminonly.POST("/", h.CreateMuscleGroup)
			adminonly.PATCH("/:id", h.UpdateMuscleGroup)
			adminonly.DELETE("/:id", h.DeleteMuscleGroup)
		}

	}
}

func (h *ExerciseHandler) CreateExercise(c *gin.Context) {
	var req dto.ExerciseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ex := workout.Exercise{
		Name:          req.Name,
		IsBodyweight:  req.IsBodyweight,
		IsTimeBased:   req.IsTimeBased,
		MuscleGroupID: req.MuscleGroupID,
	}

	if err := h.svc.CreateExercise(c.Request.Context(), &ex, req.AutoTranslate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToExerciseResponse(&ex))
}

func (h *ExerciseHandler) GetExerciseByID(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exercise ID is required"})
		return
	}
	exercise, err := h.svc.GetExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToExerciseResponse(exercise))
}

func (h *ExerciseHandler) GetAllExercises(c *gin.Context) {
	exercises, err := h.svc.GetAllExercises(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.ExerciseResponse, 0, len(exercises))
	for _, e := range exercises {
		resp = append(resp, dto.ToExerciseResponse(e))
	}

	c.JSON(http.StatusOK, resp)
}

func (h *ExerciseHandler) UpdateExercise(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exercise ID is required"})
		return
	}

	var req dto.ExerciseUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	ex, err := h.svc.UpdateExercise(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToExerciseResponse(ex))
}

func (h *ExerciseHandler) DeleteExercise(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exercise ID is required"})
		return
	}
	if err := h.svc.DeleteExercise(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ExerciseHandler) GetAllMuscleGroups(c *gin.Context) {
	muscleGroups, err := h.svc.GetAllMuscleGroups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.MuscleGroupResponse, 0, len(muscleGroups))
	for _, mg := range muscleGroups {
		resp = append(resp, dto.ToMuscleGroupResponse(mg))
	}

	c.JSON(http.StatusOK, resp)
}

func (h *ExerciseHandler) GetMuscleGroupByID(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Muscle Group ID is required"})
		return
	}
	muscleGroup, err := h.svc.GetMuscleGroupByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToMuscleGroupResponse(muscleGroup))
}

func (h *ExerciseHandler) CreateMuscleGroup(c *gin.Context) {
	var req dto.MuscleGroupCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	muscleGroup := workout.MuscleGroup{
		Name: req.Name,
	}

	if err := h.svc.CreateMuscleGroup(c.Request.Context(), &muscleGroup, req.AutoTranslate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToMuscleGroupResponse(&muscleGroup))
}

func (h *ExerciseHandler) UpdateMuscleGroup(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Muscle Group ID is required"})
		return
	}
	var req dto.MuscleGroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	mg, err := h.svc.UpdateMuscleGroup(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToMuscleGroupResponse(mg))
}

func (h *ExerciseHandler) DeleteMuscleGroup(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Muscle Group ID is required"})
		return
	}
	if err := h.svc.DeleteMuscleGroup(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
