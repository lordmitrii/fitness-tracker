package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
)

type WorkoutHandler struct {
	svc usecase.WorkoutService
}

func NewWorkoutHandler(r *gin.RouterGroup, svc usecase.WorkoutService) {
	h := &WorkoutHandler{svc: svc}

	auth := r.Group("")
	auth.Use(middleware.JWTMiddleware())

	// Workout Plan Routes
	wp := auth.Group("/workout-plans")
	{
		wp.POST("", h.CreateWorkoutPlan)
		wp.GET("/:id", h.GetWorkoutPlan)
		wp.GET("/", h.GetWorkoutPlansByUserID)
		wp.PUT("/:id", h.UpdateWorkoutPlan)
		wp.DELETE("/:id", h.DeleteWorkoutPlan)

        wp.POST("/:id/workouts", h.AddWorkoutToWorkoutPlan)
        wp.GET("/:id/workouts", h.GetWorkoutsByWorkoutPlanID)
	}

    // Workout Routes
    w := auth.Group("/workouts")
    {
        w.GET("/:id", h.GetWorkoutByID)
        w.PUT("/:id", h.UpdateWorkout)
        w.DELETE("/:id", h.DeleteWorkout)

        w.POST("/:id/exercises", h.AddExerciseToWorkout)
        w.GET("/:id/exercises", h.GetExercisesByWorkoutID)
    }

    // Exercise Routes
    e := auth.Group("/exercises")
    {
        e.GET("/:id", h.GetExerciseByID)
        e.PUT("/:id", h.UpdateExercise)
        e.DELETE("/:id", h.DeleteExercise)
    }


}

func (h *WorkoutHandler) CreateWorkoutPlan(c *gin.Context) {
    var req workout.WorkoutPlan
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    userID, _ := c.Get("userID")
    req.UserID = userID.(uint)

    if err := h.svc.CreateWorkoutPlan(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutPlan(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    wp, err := h.svc.GetWorkoutPlanByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, wp)
}
func (h *WorkoutHandler) GetWorkoutPlansByUserID(c *gin.Context) {
    userID, _ := c.Get("userID")
    wps, err := h.svc.GetWorkoutPlansByUserID(c.Request.Context(), userID.(uint))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, wps)
}

func (h *WorkoutHandler) UpdateWorkoutPlan(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    var req workout.WorkoutPlan
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    req.ID = uint(id)

    if err := h.svc.UpdateWorkoutPlan(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, req)
}
func (h *WorkoutHandler) DeleteWorkoutPlan(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    if err := h.svc.DeleteWorkoutPlan(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) AddWorkoutToWorkoutPlan(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    var req workout.Workout
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    req.WorkoutPlanID = uint(id)

    if err := h.svc.CreateWorkout(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutsByWorkoutPlanID(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    workouts, err := h.svc.GetWorkoutsByWorkoutPlanID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, workouts)
}

func (h *WorkoutHandler) GetWorkoutByID(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    workout, err := h.svc.GetWorkoutByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, workout)
}

func (h *WorkoutHandler) UpdateWorkout(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    var req workout.Workout
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    req.ID = uint(id)

    if err := h.svc.UpdateWorkout(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, req)
}
func (h *WorkoutHandler) DeleteWorkout(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    if err := h.svc.DeleteWorkout(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) AddExerciseToWorkout(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    var req workout.Exercise
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    req.WorkoutID = uint(id)

    if err := h.svc.CreateExercise(c.Request.Context(), &req); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetExercisesByWorkoutID(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    exercises, err := h.svc.GetExercisesByWorkoutID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, exercises)
}

func (h *WorkoutHandler) GetExerciseByID(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    exercise, err := h.svc.GetExerciseByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, exercise)
}

func (h *WorkoutHandler) UpdateExercise(c *gin.Context) {
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

func (h *WorkoutHandler) DeleteExercise(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    if err := h.svc.DeleteExercise(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusNoContent, nil)
}