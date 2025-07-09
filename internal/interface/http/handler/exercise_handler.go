package handler

import (
	"strconv"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type ExerciseHandler struct {
	svc usecase.ExerciseService
}

func NewExerciseHandler(r *gin.RouterGroup, svc usecase.ExerciseService) {
	h := &ExerciseHandler{svc: svc}
	auth := r.Group("")
	auth.Use(middleware.JWTMiddleware())

	ex := auth.Group("/exercises")
	{
		ex.GET("/", h.GetAllExercises)
		ex.GET("/:id", h.GetExerciseByID)
		ex.POST("/", h.CreateExercise)
		ex.PATCH("/:id", h.UpdateExercise)
		ex.DELETE("/:id", h.DeleteExercise)
	}

	mg := auth.Group("/muscle-groups")
	{
		mg.GET("/", h.GetAllMuscleGroups)
		mg.GET("/:id", h.GetMuscleGroupByID)
		mg.POST("/", h.CreateMuscleGroup)
		mg.PATCH("/:id", h.UpdateMuscleGroup)
		mg.DELETE("/:id", h.DeleteMuscleGroup)

	}
}

func (h *ExerciseHandler) CreateExercise(c *gin.Context) {
	var req workout.Exercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.CreateExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *ExerciseHandler) GetExerciseByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	exercise, err := h.svc.GetExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, exercise)
}

func (h *ExerciseHandler) GetAllExercises(c *gin.Context) {
	exercises, err := h.svc.GetAllExercises(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, exercises)
}

func (h *ExerciseHandler) UpdateExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req workout.Exercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)

	if err := h.svc.UpdateExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *ExerciseHandler) DeleteExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.DeleteExercise(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *ExerciseHandler) GetAllMuscleGroups(c *gin.Context) {
	muscleGroups, err := h.svc.GetAllMuscleGroups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, muscleGroups)
}

func (h *ExerciseHandler) GetMuscleGroupByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	muscleGroup, err := h.svc.GetMuscleGroupByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, muscleGroup)
}

func (h *ExerciseHandler) CreateMuscleGroup(c *gin.Context) {
	var req workout.MuscleGroup
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.CreateMuscleGroup(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *ExerciseHandler) UpdateMuscleGroup(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req workout.MuscleGroup
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)

	if err := h.svc.UpdateMuscleGroup(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

func (h *ExerciseHandler) DeleteMuscleGroup(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.DeleteMuscleGroup(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
