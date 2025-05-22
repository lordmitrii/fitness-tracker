package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/middleware"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
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
		wp.GET("", h.GetWorkoutPlansByUserID)
		wp.GET("/:id", h.GetWorkoutPlan)
		wp.PUT("/:id", h.UpdateWorkoutPlan)
		wp.DELETE("/:id", h.DeleteWorkoutPlan)

		wp.POST("/:id/workouts-cycles", h.AddWorkoutCycleToWorkoutPlan)
		wp.GET("/:id/workouts-cycles", h.GetWorkoutCyclesByWorkoutPlanID)

		wp.GET("/:id/workout-cycles/:cycleID", h.GetWorkoutCycleByID)
		wp.PUT("/:id/workout-cycles/:cycleID", h.UpdateWorkoutCycle)
		wp.DELETE("/:id/workout-cycles/:cycleID", h.DeleteWorkoutCycle)

		wp.POST("/:id/workout-cycles/:cycleID/workouts", h.AddWorkoutToWorkoutCycle)
		wp.GET("/:id/workout-cycles/:cycleID/workouts", h.GetWorkoutsByWorkoutCycleID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.GetWorkoutByID)
		wp.PUT("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.UpdateWorkout)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.DeleteWorkout)

		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.AddWorkoutExerciseToWorkout)
		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.GetWorkoutExercisesByWorkoutID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.GetWorkoutExerciseByID)
		wp.PUT("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.UpdateWorkoutExercise)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.DeleteWorkoutExercise)

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

func (h *WorkoutHandler) AddWorkoutCycleToWorkoutPlan(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req workout.WorkoutCycle
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutPlanID = uint(id)

	if err := h.svc.CreateWorkoutCycle(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutCyclesByWorkoutPlanID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	workouts, err := h.svc.GetWorkoutCyclesByWorkoutPlanID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, workouts)
}

func (h *WorkoutHandler) GetWorkoutCycleByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)
	workoutCycle, err := h.svc.GetWorkoutCycleByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, workoutCycle)
}
func (h *WorkoutHandler) UpdateWorkoutCycle(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)
	var req workout.WorkoutCycle
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)

	if err := h.svc.UpdateWorkoutCycle(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}
func (h *WorkoutHandler) DeleteWorkoutCycle(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)
	if err := h.svc.DeleteWorkoutCycle(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) AddWorkoutToWorkoutCycle(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)
	var req workout.Workout
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutCycleID = uint(id)

	if err := h.svc.CreateWorkout(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutsByWorkoutCycleID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)
	workouts, err := h.svc.GetWorkoutsByWorkoutCycleID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, workouts)
}

func (h *WorkoutHandler) GetWorkoutByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	workout, err := h.svc.GetWorkoutByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, workout)
}

func (h *WorkoutHandler) UpdateWorkout(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
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
	id, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	if err := h.svc.DeleteWorkout(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) AddWorkoutExerciseToWorkout(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	var req workout.WorkoutExercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutID = uint(id)

	if err := h.svc.CreateWorkoutExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutExercisesByWorkoutID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	exercises, err := h.svc.GetWorkoutExercisesByWorkoutID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, exercises)
}

func (h *WorkoutHandler) GetWorkoutExerciseByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	exercise, err := h.svc.GetWorkoutExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, exercise)
}

func (h *WorkoutHandler) UpdateWorkoutExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	var req workout.WorkoutExercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)

	if err := h.svc.UpdateWorkoutExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) DeleteWorkoutExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	if err := h.svc.DeleteWorkoutExercise(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
