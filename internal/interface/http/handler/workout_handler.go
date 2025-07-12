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

	ie := auth.Group("/individual-exercises")
	{
		ie.GET("", h.GetIndividualExercises)
		ie.POST("", h.GetOrCreateIndividualExercise)
		ie.GET("/stats", h.GetIndividualExercisesStats)
	}

	// Workout Plan Routes
	wp := auth.Group("/workout-plans")
	{
		wp.POST("", h.CreateWorkoutPlan)
		wp.GET("", h.GetWorkoutPlansByUserID)
		wp.GET("/:id", h.GetWorkoutPlan)
		wp.PATCH("/:id", h.UpdateWorkoutPlan)
		wp.DELETE("/:id", h.DeleteWorkoutPlan)
		wp.PATCH("/:id/set-active", h.SetActiveWorkoutPlan)

		wp.POST("/:id/workout-cycles", h.AddWorkoutCycleToWorkoutPlan)
		wp.GET("/:id/workout-cycles", h.GetWorkoutCyclesByWorkoutPlanID)

		wp.GET("/:id/workout-cycles/:cycleID", h.GetWorkoutCycleByID)
		wp.PATCH("/:id/workout-cycles/:cycleID", h.UpdateWorkoutCycle)
		wp.DELETE("/:id/workout-cycles/:cycleID", h.DeleteWorkoutCycle)
		wp.PATCH("/:id/workout-cycles/:cycleID/update-complete", h.CompleteWorkoutCycle)

		wp.POST("/:id/workout-cycles/:cycleID/workouts", h.AddWorkoutToWorkoutCycle)
		wp.GET("/:id/workout-cycles/:cycleID/workouts", h.GetWorkoutsByWorkoutCycleID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.GetWorkoutByID)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.UpdateWorkout)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.DeleteWorkout)

		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.AddWorkoutExerciseToWorkout)
		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.GetWorkoutExercisesByWorkoutID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.GetWorkoutExerciseByID)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.UpdateWorkoutExercise)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID", h.DeleteWorkoutExercise)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/update-complete", h.CompleteWorkoutExercise)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/move", h.MoveWorkoutExercise)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/replace", h.ReplaceWorkoutExercise)

		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets", h.AddWorkoutSetToWorkoutExercise)
		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets", h.GetWorkoutSetsByWorkoutExerciseID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets/:setID", h.GetWorkoutSetByID)
		wp.PATCH(":id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets/:setID", h.UpdateWorkoutSet)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets/:setID", h.DeleteWorkoutSet)
		wp.PATCH(":id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets/:setID/update-complete", h.CompleteWorkoutSet)
		wp.POST(":id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:exerciseID/workout-sets/:setID/move", h.MoveWorkoutSet)
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

func (h *WorkoutHandler) SetActiveWorkoutPlan(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	userID, _ := c.Get("userID")
	var req workout.WorkoutPlan
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)
	req.UserID = userID.(uint)
	if err := h.svc.SetActiveWorkoutPlan(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Workout plan set as active"})
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

func (h *WorkoutHandler) CompleteWorkoutCycle(c *gin.Context) {
	workoutPlanID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	cycleID, _ := strconv.ParseUint(c.Param("cycleID"), 10, 64)

	var req workout.WorkoutCycle
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutPlanID = uint(workoutPlanID)
	req.ID = uint(cycleID)

	nextCycleID, err := h.svc.CompleteWorkoutCycle(c.Request.Context(), &req)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	req.NextCycleID = nextCycleID

	c.JSON(http.StatusOK, req)
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

	var req struct {
		workout.WorkoutExercise
		SetsQt int64 `json:"sets_qt"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutID = uint(id)

	err := h.svc.CreateWorkoutExercise(c.Request.Context(), &req.WorkoutExercise, req.SetsQt)
	if err != nil {
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
	workoutID, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	var req workout.WorkoutExercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(id)
	req.WorkoutID = uint(workoutID)

	if err := h.svc.UpdateWorkoutExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) CompleteWorkoutExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	workoutID, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	var req workout.WorkoutExercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = uint(id)
	req.WorkoutID = uint(workoutID)

	if err := h.svc.CompleteWorkoutExercise(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) MoveWorkoutExercise(c *gin.Context) {
	workoutID, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	exerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)

	var req struct {
		Direction string `json:"direction"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.MoveWorkoutExercise(c.Request.Context(), uint(workoutID), uint(exerciseID), req.Direction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exercise moved successfully"})
}

func (h *WorkoutHandler) ReplaceWorkoutExercise(c *gin.Context) {
	workoutID, _ := strconv.ParseUint(c.Param("workoutID"), 10, 64)
	exerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)

	var req struct {
		IndividualExerciseID uint  `json:"individual_exercise_id"`
		SetsQt               int64 `json:"sets_qt"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	we, err := h.svc.ReplaceWorkoutExercise(c.Request.Context(), uint(workoutID), uint(exerciseID), req.IndividualExerciseID, req.SetsQt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, we)
}

func (h *WorkoutHandler) DeleteWorkoutExercise(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	if err := h.svc.DeleteWorkoutExercise(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) AddWorkoutSetToWorkoutExercise(c *gin.Context) {
	workoutExerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	var req workout.WorkoutSet
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.WorkoutExerciseID = uint(workoutExerciseID)

	if err := h.svc.CreateWorkoutSet(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *WorkoutHandler) GetWorkoutSetsByWorkoutExerciseID(c *gin.Context) {
	workoutExerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	sets, err := h.svc.GetWorkoutSetsByWorkoutExerciseID(c.Request.Context(), uint(workoutExerciseID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, sets)
}
func (h *WorkoutHandler) DeleteWorkoutSet(c *gin.Context) {
	setID, _ := strconv.ParseUint(c.Param("setID"), 10, 64)
	if err := h.svc.DeleteWorkoutSet(c.Request.Context(), uint(setID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *WorkoutHandler) GetWorkoutSetByID(c *gin.Context) {
	setID, _ := strconv.ParseUint(c.Param("setID"), 10, 64)
	set, err := h.svc.GetWorkoutSetByID(c.Request.Context(), uint(setID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, set)
}

func (h *WorkoutHandler) UpdateWorkoutSet(c *gin.Context) {
	setID, _ := strconv.ParseUint(c.Param("setID"), 10, 64)
	workoutExerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	var req workout.WorkoutSet
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(setID)
	req.WorkoutExerciseID = uint(workoutExerciseID)

	if err := h.svc.UpdateWorkoutSet(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) CompleteWorkoutSet(c *gin.Context) {
	setID, _ := strconv.ParseUint(c.Param("setID"), 10, 64)
	workoutExerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	var req workout.WorkoutSet
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uint(setID)
	req.WorkoutExerciseID = uint(workoutExerciseID)

	if err := h.svc.CompleteWorkoutSet(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *WorkoutHandler) MoveWorkoutSet(c *gin.Context) {
	workoutExerciseID, _ := strconv.ParseUint(c.Param("exerciseID"), 10, 64)
	setID, _ := strconv.ParseUint(c.Param("setID"), 10, 64)

	var req struct {
		Direction string `json:"direction"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.MoveWorkoutSet(c.Request.Context(), uint(workoutExerciseID), uint(setID), req.Direction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Set moved successfully"})
}

func (h *WorkoutHandler) GetIndividualExercises(c *gin.Context) {
	userID, _ := c.Get("userID")

	exercises, err := h.svc.GetIndividualExercisesByUserID(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, exercises)
}

func (h *WorkoutHandler) GetOrCreateIndividualExercise(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req workout.IndividualExercise
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.UserID = userID.(uint)
	individualExercise, err := h.svc.GetOrCreateIndividualExercise(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, individualExercise)
}

func (h *WorkoutHandler) GetIndividualExercisesStats(c *gin.Context) {
	userID, _ := c.Get("userID")
	stats, err := h.svc.GetIndividualExerciseStats(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
