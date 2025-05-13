package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	usecase "github.com/lordmitrii/golang-web-gin/internal/usecase/workout"
)

type WorkoutHandler struct {
    svc *usecase.Service
}

// NewWorkoutHandler instantiates the handler.
func NewWorkoutHandler(r *gin.RouterGroup, svc *usecase.Service) {
    h := &WorkoutHandler{svc: svc}
    ws := r.Group("/workouts")
    {
        ws.POST("", h.Create)
        ws.GET("", h.List)
        ws.GET(":id", h.Get)
        ws.PUT(":id", h.Update)
        ws.DELETE(":id", h.Delete)
    }
}

func (h *WorkoutHandler) Create(c *gin.Context) {
    var req workout.Workout
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := h.svc.CreateWorkout(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) List(c *gin.Context) {
    workouts, err := h.svc.ListWorkouts(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, workouts)
}

func (h *WorkoutHandler) Get(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    w, err := h.svc.GetWorkoutByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
        return
    }
    c.JSON(http.StatusOK, w)
}

func (h *WorkoutHandler) Update(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    var req workout.Workout
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    req.ID = uint(id)
    if err := h.svc.UpdateWorkout(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
        return
    }
    c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) Delete(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    if err := h.svc.DeleteWorkout(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
        return
    }
    c.Status(http.StatusNoContent)
}