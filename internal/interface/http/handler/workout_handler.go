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

// NewWorkoutHandler instantiates the handler and sets up the routes 
func NewWorkoutHandler(r *gin.RouterGroup, svc usecase.WorkoutService) {
    h := &WorkoutHandler{svc: svc}
    ws := r.Group("/workouts")
    ws.Use(middleware.JWTMiddleware())
    {
        ws.POST("", h.Create)
        ws.GET("", h.List)
        ws.GET(":id", h.Get)
        ws.PUT(":id", h.Update)
        ws.DELETE(":id", h.Delete)
    }
}

// CreateWorkout godoc
// @Summary      Log a new workout
// @Description  create a workout record for the authenticated user
// @Tags         workouts
// @Accept       json
// @Produce      json
// @Param        workout  body      workout.Workout  true  "Workout payload"
// @Success      201      {object}  workout.Workout
// @Failure      400      {object}  handler.ErrorResponse
// @Failure      500      {object}  handler.ErrorResponse
// @Router       /workouts [post]
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

// ListWorkouts godoc
// @Summary      List workouts
// @Description  get all workouts for the authenticated user
// @Tags         workouts
// @Produce      json
// @Success      200  {array}   workout.Workout
// @Failure      500  {object}  handler.ErrorResponse
// @Failure      401  {object}  handler.ErrorResponse
// @Router       /workouts [get]
func (h *WorkoutHandler) List(c *gin.Context) {
    workouts, err := h.svc.ListWorkouts(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, workouts)
}

// GetWorkout godoc
// @Summary      Get a single workout
// @Description  get workout by its ID
// @Tags         workouts
// @Produce      json
// @Param        id   path      int  true  "Workout ID"
// @Success      200  {object}  workout.Workout
// @Failure      404  {object}  handler.ErrorResponse
// @Failure      500  {object}  handler.ErrorResponse
// @Failure      401  {object}  handler.ErrorResponse
// @Router       /workouts/{id} [get]
func (h *WorkoutHandler) Get(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    w, err := h.svc.GetWorkoutByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.JSON(http.StatusOK, w)
}

// UpdateWorkout godoc
// @Summary      Update a workout
// @Description  update a workout record for the authenticated user
// @Tags         workouts
// @Accept       json
// @Produce      json
// @Param        id      path      int  true  "Workout ID"
// @Param        workout body      workout.Workout  true  "Workout payload"
// @Success      200      {object}  workout.Workout
// @Failure      400      {object}  handler.ErrorResponse
// @Failure      404      {object}  handler.ErrorResponse
// @Router       /workouts/{id} [put]
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

// DeleteWorkout godoc
// @Summary      Delete a workout
// @Description  delete a workout record for the authenticated user
// @Tags         workouts
// @Param        id   path      int  true  "Workout ID"
// @Success      204
// @Failure      404  {object}  handler.ErrorResponse	
// @Router       /workouts/{id} [delete]
func (h *WorkoutHandler) Delete(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    if err := h.svc.DeleteWorkout(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
        return
    }
    c.Status(http.StatusNoContent)
}