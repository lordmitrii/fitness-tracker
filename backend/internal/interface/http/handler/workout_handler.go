package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/http/dto"
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
		wp.POST("/:id/workout-cycles/:cycleID/workouts/create-multiple", h.CreateMultipleWorkouts)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.GetWorkoutByID)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.UpdateWorkout)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID", h.DeleteWorkout)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/update-complete", h.CompleteWorkout)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/move", h.MoveWorkout)

		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.AddWorkoutExerciseToWorkout)
		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises", h.GetWorkoutExercisesByWorkoutID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID", h.GetWorkoutExerciseByID)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID", h.UpdateWorkoutExercise)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID", h.DeleteWorkoutExercise)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/update-complete", h.CompleteWorkoutExercise)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/move", h.MoveWorkoutExercise)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/replace", h.ReplaceWorkoutExercise)

		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets", h.AddWorkoutSetToWorkoutExercise)
		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets", h.GetWorkoutSetsByWorkoutExerciseID)

		wp.GET("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets/:setID", h.GetWorkoutSetByID)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets/:setID", h.UpdateWorkoutSet)
		wp.DELETE("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets/:setID", h.DeleteWorkoutSet)
		wp.PATCH("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets/:setID/update-complete", h.CompleteWorkoutSet)
		wp.POST("/:id/workout-cycles/:cycleID/workouts/:workoutID/workout-exercises/:weID/workout-sets/:setID/move", h.MoveWorkoutSet)
	}

	auth.GET("/current-cycle", h.GetCurrentWorkoutCycle)
}

// CreateWorkoutPlan godoc
// @Summary      Create workout plan
// @Tags         workout-plans
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.WorkoutPlanCreateRequest  true  "Workout plan payload"
// @Success      201   {object}  dto.WorkoutPlanResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /workout-plans [post]
func (h *WorkoutHandler) CreateWorkoutPlan(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.WorkoutPlanCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	in := &workout.WorkoutPlan{
		Name:   req.Name,
		UserID: userID,
		Active: req.Active,
	}

	wp, err := h.svc.CreateWorkoutPlan(c.Request.Context(), in)
	if err != nil || wp == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToWorkoutPlanResponse(wp))
}

// GetWorkoutPlan godoc
// @Summary      Get workout plan
// @Tags         workout-plans
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      uint  true  "Workout Plan ID" example(1)
// @Success      200  {object}  dto.WorkoutPlanResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id} [get]
func (h *WorkoutHandler) GetWorkoutPlan(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	wp, err := h.svc.GetWorkoutPlanByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutPlanResponse(wp))
}

// GetWorkoutPlansByUserID godoc
// @Summary      List workout plans for current user
// @Tags         workout-plans
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   dto.WorkoutPlanResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans [get]
func (h *WorkoutHandler) GetWorkoutPlansByUserID(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}
	wps, err := h.svc.GetWorkoutPlansByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.WorkoutPlanResponse, 0, len(wps))
	for _, wp := range wps {
		resp = append(resp, dto.ToWorkoutPlanResponse(wp))
	}

	c.JSON(http.StatusOK, resp)
}

// UpdateWorkoutPlan godoc
// @Summary      Update workout plan
// @Tags         workout-plans
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      uint                       true  "Workout Plan ID" example(1)
// @Param        body  body      dto.WorkoutPlanUpdateRequest true "Fields to update"
// @Success      200   {object}  dto.WorkoutPlanResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /workout-plans/{id} [patch]
func (h *WorkoutHandler) UpdateWorkoutPlan(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	var req dto.WorkoutPlanUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	wp, err := h.svc.UpdateWorkoutPlan(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutPlanResponse(wp))
}

// DeleteWorkoutPlan godoc
// @Summary      Delete workout plan
// @Tags         workout-plans
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      uint  true  "Workout Plan ID" example(1)
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /workout-plans/{id} [delete]
func (h *WorkoutHandler) DeleteWorkoutPlan(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	if err := h.svc.DeleteWorkoutPlan(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// SetActiveWorkoutPlan godoc
// @Summary      Set workout plan active/inactive
// @Tags         workout-plans
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      uint                          true  "Workout Plan ID" example(1)
// @Param        body  body      dto.SetActiveWorkoutPlanRequest true "Active flag"
// @Success      200   {object}  dto.WorkoutPlanResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/set-active [patch]
func (h *WorkoutHandler) SetActiveWorkoutPlan(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	var req dto.SetActiveWorkoutPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	wp, err := h.svc.SetActiveWorkoutPlan(c.Request.Context(), uint(id), req.Active)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToWorkoutPlanResponse(wp))
}

// AddWorkoutCycleToWorkoutPlan godoc
// @Summary      Add cycle to workout plan
// @Tags         workout-cycles
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      uint                         true  "Workout Plan ID" example(1)
// @Param        body  body      dto.WorkoutCycleCreateRequest true "Cycle payload"
// @Success      201   {object}  dto.WorkoutCycleResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles [post]
func (h *WorkoutHandler) AddWorkoutCycleToWorkoutPlan(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}

	var req dto.WorkoutCycleCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wc := &workout.WorkoutCycle{
		Name:          req.Name,
		WeekNumber:    req.WeekNumber,
		WorkoutPlanID: uint(id),
	}

	if err := h.svc.CreateWorkoutCycle(c.Request.Context(), wc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToWorkoutCycleResponse(wc))
}

// GetWorkoutCyclesByWorkoutPlanID godoc
// @Summary      List cycles for a workout plan
// @Tags         workout-cycles
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      uint  true  "Workout Plan ID" example(1)
// @Success      200  {array}   dto.WorkoutCycleResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles [get]
func (h *WorkoutHandler) GetWorkoutCyclesByWorkoutPlanID(c *gin.Context) {
	id := parseUint(c.Param("id"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}

	workouts, err := h.svc.GetWorkoutCyclesByWorkoutPlanID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.WorkoutCycleResponse, 0, len(workouts))
	for _, wc := range workouts {
		resp = append(resp, dto.ToWorkoutCycleResponse(wc))
	}

	c.JSON(http.StatusOK, resp)
}

// GetWorkoutCycleByID godoc
// @Summary      Get cycle by ID
// @Tags         workout-cycles
// @Security     BearerAuth
// @Produce      json
// @Param        id       path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint  true  "Cycle ID"        example(12)
// @Success      200  {object}  dto.WorkoutCycleResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID} [get]
func (h *WorkoutHandler) GetWorkoutCycleByID(c *gin.Context) {
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	workoutCycle, err := h.svc.GetWorkoutCycleByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToWorkoutCycleResponse(workoutCycle))
}

// UpdateWorkoutCycle godoc
// @Summary      Update cycle
// @Tags         workout-cycles
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      uint                           true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint                           true  "Cycle ID"        example(12)
// @Param        body     body      dto.WorkoutCycleUpdateRequest  true  "Fields to update"
// @Success      200      {object}  dto.WorkoutCycleResponse
// @Failure      400      {object}  dto.MessageResponse
// @Failure      401      {object}  dto.MessageResponse
// @Failure      500      {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID} [patch]
func (h *WorkoutHandler) UpdateWorkoutCycle(c *gin.Context) {
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req dto.WorkoutCycleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	wc, err := h.svc.UpdateWorkoutCycle(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutCycleResponse(wc))
}
// DeleteWorkoutCycle godoc
// @Summary      Delete cycle
// @Tags         workout-cycles
// @Security     BearerAuth
// @Produce      json
// @Param        id       path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint  true  "Cycle ID"        example(12)
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID} [delete]
func (h *WorkoutHandler) DeleteWorkoutCycle(c *gin.Context) {
	planId := parseUint(c.Param("id"), 0)
	if planId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	if err := h.svc.DeleteWorkoutCycle(c.Request.Context(), planId, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// CompleteWorkoutCycle godoc
// @Summary      Mark cycle completed/skipped
// @Tags         workout-cycles
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      uint                           true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint                           true  "Cycle ID"        example(12)
// @Param        body     body      dto.WorkoutCycleCompleteRequest true "Complete payload"
// @Success      200      {object}  dto.WorkoutCycleResponse
// @Failure      400      {object}  dto.MessageResponse
// @Failure      401      {object}  dto.MessageResponse
// @Failure      500      {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/update-complete [patch]
func (h *WorkoutHandler) CompleteWorkoutCycle(c *gin.Context) {
	planId := parseUint(c.Param("id"), 0)
	if planId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Plan ID is required"})
		return
	}
	cycleID := parseUint(c.Param("cycleID"), 0)
	if cycleID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req dto.WorkoutCycleCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wc, err := h.svc.CompleteWorkoutCycle(c.Request.Context(), planId, cycleID, req.Completed, req.Skipped)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutCycleResponse(wc))
}

// AddWorkoutToWorkoutCycle godoc
// @Summary      Add workout to cycle
// @Tags         workouts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      uint                    true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint                    true  "Cycle ID"        example(12)
// @Param        body     body      dto.WorkoutCreateRequest true "Workout payload"
// @Success      201      {object}  dto.WorkoutResponse
// @Failure      400      {object}  dto.MessageResponse
// @Failure      401      {object}  dto.MessageResponse
// @Failure      500      {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts [post]
func (h *WorkoutHandler) AddWorkoutToWorkoutCycle(c *gin.Context) {
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req dto.WorkoutCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	w := &workout.Workout{
		Name:           req.Name,
		Date:           req.Date,
		Index:          req.Index,
		WorkoutCycleID: uint(id),
	}

	if err := h.svc.CreateWorkout(c.Request.Context(), w); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToWorkoutResponse(w))
}
// GetWorkoutsByWorkoutCycleID godoc
// @Summary      List workouts in a cycle
// @Tags         workouts
// @Security     BearerAuth
// @Produce      json
// @Param        id       path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint  true  "Cycle ID"        example(12)
// @Success      200      {array}   dto.WorkoutResponse
// @Failure      400      {object}  dto.MessageResponse
// @Failure      401      {object}  dto.MessageResponse
// @Failure      404      {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts [get]
func (h *WorkoutHandler) GetWorkoutsByWorkoutCycleID(c *gin.Context) {
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	workouts, err := h.svc.GetWorkoutsByWorkoutCycleID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.WorkoutResponse, 0, len(workouts))
	for _, w := range workouts {
		resp = append(resp, dto.ToWorkoutResponse(w))
	}

	c.JSON(http.StatusOK, resp)
}

// CreateMultipleWorkouts godoc
// @Summary      Bulk create workouts in a cycle
// @Tags         workouts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      uint                        true  "Workout Plan ID" example(1)
// @Param        cycleID  path      uint                        true  "Cycle ID"        example(12)
// @Param        body     body      []dto.WorkoutBulkCreateRequest true "Array of workouts"
// @Success      201      {object}  dto.MessageResponse
// @Failure      400      {object}  dto.MessageResponse
// @Failure      401      {object}  dto.MessageResponse
// @Failure      500      {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/create-multiple [post]
func (h *WorkoutHandler) CreateMultipleWorkouts(c *gin.Context) {
	id := parseUint(c.Param("cycleID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req []dto.WorkoutBulkCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workouts := make([]*workout.Workout, 0, len(req))
	for _, r := range req {
		w := &workout.Workout{
			Name:           r.Name,
			Date:           r.Date,
			Index:          r.Index,
			WorkoutCycleID: uint(id),
		}
		if len(r.WorkoutExercises) > 0 {
			w.WorkoutExercises = make([]*workout.WorkoutExercise, 0, len(r.WorkoutExercises))
			for _, ex := range r.WorkoutExercises {
				w.WorkoutExercises = append(w.WorkoutExercises, &workout.WorkoutExercise{
					IndividualExerciseID: ex.IndividualExerciseID,
					Index:                ex.Index,
					SetsQt:               ex.SetsQt,
				})
			}

		}
		workouts = append(workouts, w)
	}

	if err := h.svc.CreateMultipleWorkouts(c.Request.Context(), uint(id), workouts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.MessageResponse{Message: "Workouts created successfully"})
}
// GetWorkoutByID godoc
// @Summary      Get workout
// @Tags         workouts
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Success      200  {object}  dto.WorkoutResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID} [get]
func (h *WorkoutHandler) GetWorkoutByID(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	workout, err := h.svc.GetWorkoutByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToWorkoutResponse(workout))
}
// UpdateWorkout godoc
// @Summary      Update workout
// @Tags         workouts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                      true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                      true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                      true  "Workout ID"      example(100)
// @Param        body       body      dto.WorkoutUpdateRequest  true  "Fields to update"
// @Success      200        {object}  dto.WorkoutResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID} [patch]
func (h *WorkoutHandler) UpdateWorkout(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	var req dto.WorkoutUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	w, err := h.svc.UpdateWorkout(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutResponse(w))
}
// DeleteWorkout godoc
// @Summary      Delete workout
// @Tags         workouts
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID} [delete]
func (h *WorkoutHandler) DeleteWorkout(c *gin.Context) {
	cycleID := parseUint(c.Param("cycleID"), 0)
	if cycleID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	if err := h.svc.DeleteWorkout(c.Request.Context(), cycleID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// CompleteWorkout godoc
// @Summary      Mark workout completed/skipped
// @Tags         workouts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                       true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                       true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                       true  "Workout ID"      example(100)
// @Param        body       body      dto.WorkoutCompleteRequest true  "Complete payload"
// @Success      200        {object}  dto.WorkoutResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/update-complete [patch]
func (h *WorkoutHandler) CompleteWorkout(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	cycleID := parseUint(c.Param("cycleID"), 0)
	if cycleID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req dto.WorkoutCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	w, err := h.svc.CompleteWorkout(c.Request.Context(), cycleID, id, req.Completed, req.Skipped)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutResponse(w))
}
// MoveWorkout godoc
// @Summary      Move workout position within cycle
// @Tags         workouts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                   true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                   true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                   true  "Workout ID"      example(100)
// @Param        body       body      dto.WorkoutMoveRequest true  "Move payload"
// @Success      200        {object}  dto.MessageResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/move [post]
func (h *WorkoutHandler) MoveWorkout(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	cycleID := parseUint(c.Param("cycleID"), 0)
	if cycleID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle ID is required"})
		return
	}

	var req dto.WorkoutMoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.MoveWorkout(c.Request.Context(), uint(id), uint(cycleID), req.Direction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Workout moved successfully"})
}
// AddWorkoutExerciseToWorkout godoc
// @Summary      Add exercise to workout
// @Tags         workout-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                             true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                             true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                             true  "Workout ID"      example(100)
// @Param        body       body      dto.WorkoutExerciseCreateRequest true  "Exercise payload"
// @Success      201        {object}  dto.WorkoutExerciseResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises [post]
func (h *WorkoutHandler) AddWorkoutExerciseToWorkout(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	var req dto.WorkoutExerciseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	we := &workout.WorkoutExercise{
		WorkoutID:            uint(id),
		IndividualExerciseID: req.IndividualExerciseID,
		Index:                req.Index,
		SetsQt:               req.SetsQt,
	}

	err := h.svc.CreateWorkoutExercise(c.Request.Context(), we)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToWorkoutExerciseResponse(we))
}
// GetWorkoutExercisesByWorkoutID godoc
// @Summary      List exercises in a workout
// @Tags         workout-exercises
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Success      200  {array}   dto.WorkoutExerciseResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises [get]
func (h *WorkoutHandler) GetWorkoutExercisesByWorkoutID(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}

	exercises, err := h.svc.GetWorkoutExercisesByWorkoutID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.WorkoutExerciseResponse, 0, len(exercises))
	for _, ex := range exercises {
		resp = append(resp, dto.ToWorkoutExerciseResponse(ex))
	}

	c.JSON(http.StatusOK, resp)
}
// GetWorkoutExerciseByID godoc
// @Summary      Get workout exercise
// @Tags         workout-exercises
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Param        weID       path      uint  true  "Workout Exercise ID" example(500)
// @Success      200  {object}  dto.WorkoutExerciseResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID} [get]
func (h *WorkoutHandler) GetWorkoutExerciseByID(c *gin.Context) {
	id := parseUint(c.Param("weID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	exercise, err := h.svc.GetWorkoutExerciseByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToWorkoutExerciseResponse(exercise))
}
// UpdateWorkoutExercise godoc
// @Summary      Update workout exercise
// @Tags         workout-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                           true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                           true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                           true  "Workout ID"      example(100)
// @Param        weID       path      uint                           true  "Workout Exercise ID" example(500)
// @Param        body       body      dto.WorkoutExerciseUpdateRequest true "Fields to update"
// @Success      200        {object}  dto.WorkoutExerciseResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID} [patch]
func (h *WorkoutHandler) UpdateWorkoutExercise(c *gin.Context) {
	id := parseUint(c.Param("weID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	var req dto.WorkoutExerciseUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	we, err := h.svc.UpdateWorkoutExercise(c.Request.Context(), id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutExerciseResponse(we))
}
// CompleteWorkoutExercise godoc
// @Summary      Mark workout exercise completed/skipped
// @Tags         workout-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                             true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                             true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                             true  "Workout ID"      example(100)
// @Param        weID       path      uint                             true  "Workout Exercise ID" example(500)
// @Param        body       body      dto.WorkoutExerciseCompleteRequest true "Complete payload"
// @Success      200        {object}  dto.WorkoutExerciseResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/update-complete [patch]
func (h *WorkoutHandler) CompleteWorkoutExercise(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	id := parseUint(c.Param("weID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}
	var req dto.WorkoutExerciseCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	we, err := h.svc.CompleteWorkoutExercise(c.Request.Context(), workoutID, id, req.Completed, req.Skipped)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutExerciseResponse(we))
}
// MoveWorkoutExercise godoc
// @Summary      Move workout exercise position
// @Tags         workout-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                              true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                              true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                              true  "Workout ID"      example(100)
// @Param        weID       path      uint                              true  "Workout Exercise ID" example(500)
// @Param        body       body      dto.WorkoutExerciseMoveRequest    true  "Move payload"
// @Success      200        {object}  dto.MessageResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/move [post]
func (h *WorkoutHandler) MoveWorkoutExercise(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weID := parseUint(c.Param("weID"), 0)
	if weID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	var req dto.WorkoutExerciseMoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.MoveWorkoutExercise(c.Request.Context(), uint(id), uint(weID), req.Direction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Exercise moved successfully"})
}
// ReplaceWorkoutExercise godoc
// @Summary      Replace workout exercise
// @Tags         workout-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                               true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                               true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                               true  "Workout ID"      example(100)
// @Param        weID       path      uint                               true  "Workout Exercise ID" example(500)
// @Param        body       body      dto.WorkoutExerciseReplaceRequest  true  "Replace payload"
// @Success      200        {object}  dto.WorkoutExerciseResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/replace [post]
func (h *WorkoutHandler) ReplaceWorkoutExercise(c *gin.Context) {
	id := parseUint(c.Param("workoutID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weID := parseUint(c.Param("weID"), 0)
	if weID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	var req dto.WorkoutExerciseReplaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	we, err := h.svc.ReplaceWorkoutExercise(c.Request.Context(), uint(id), uint(weID), req.IndividualExerciseID, req.SetsQt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutExerciseResponse(we))
}
// DeleteWorkoutExercise godoc
// @Summary      Delete workout exercise
// @Tags         workout-exercises
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Param        weID       path      uint  true  "Workout Exercise ID" example(500)
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID} [delete]
func (h *WorkoutHandler) DeleteWorkoutExercise(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	id := parseUint(c.Param("weID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	if err := h.svc.DeleteWorkoutExercise(c.Request.Context(), workoutID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
// AddWorkoutSetToWorkoutExercise godoc
// @Summary      Add set to workout exercise
// @Tags         workout-sets
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                         true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                         true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                         true  "Workout ID"      example(100)
// @Param        weID       path      uint                         true  "Workout Exercise ID" example(500)
// @Param        body       body      dto.WorkoutSetCreateRequest  true  "Set payload"
// @Success      201        {object}  dto.WorkoutSetResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets [post]
func (h *WorkoutHandler) AddWorkoutSetToWorkoutExercise(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weID := parseUint(c.Param("weID"), 0)
	if weID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	var req dto.WorkoutSetCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ws := &workout.WorkoutSet{
		WorkoutExerciseID: uint(weID),
		Index:             req.Index,
		Weight:            req.Weight,
		Reps:              req.Reps,
		PreviousWeight:    req.PreviousWeight,
		PreviousReps:      req.PreviousReps,
	}

	if err := h.svc.CreateWorkoutSet(c.Request.Context(), workoutID, weID, ws); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ToWorkoutSetResponse(ws))
}
// GetWorkoutSetsByWorkoutExerciseID godoc
// @Summary      List sets of a workout exercise
// @Tags         workout-sets
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Param        weID       path      uint  true  "Workout Exercise ID" example(500)
// @Success      200  {array}   dto.WorkoutSetResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets [get]
func (h *WorkoutHandler) GetWorkoutSetsByWorkoutExerciseID(c *gin.Context) {
	weID := parseUint(c.Param("weID"), 0)
	if weID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}

	sets, err := h.svc.GetWorkoutSetsByWorkoutExerciseID(c.Request.Context(), uint(weID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.WorkoutSetResponse, 0, len(sets))
	for _, set := range sets {
		resp = append(resp, dto.ToWorkoutSetResponse(set))
	}
	c.JSON(http.StatusOK, resp)
}
// DeleteWorkoutSet godoc
// @Summary      Delete a set
// @Tags         workout-sets
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Param        weID       path      uint  true  "Workout Exercise ID" example(500)
// @Param        setID      path      uint  true  "Set ID"          example(700)
// @Success      204  {string}  string "No Content"
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets/{setID} [delete]
func (h *WorkoutHandler) DeleteWorkoutSet(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weId := parseUint(c.Param("weID"), 0)
	if weId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}
	setID := parseUint(c.Param("setID"), 0)
	if setID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Set ID is required"})
		return
	}

	if err := h.svc.DeleteWorkoutSet(c.Request.Context(), workoutID, weId, setID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
// GetWorkoutSetByID godoc
// @Summary      Get a set
// @Tags         workout-sets
// @Security     BearerAuth
// @Produce      json
// @Param        id         path      uint  true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint  true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint  true  "Workout ID"      example(100)
// @Param        weID       path      uint  true  "Workout Exercise ID" example(500)
// @Param        setID      path      uint  true  "Set ID"          example(700)
// @Success      200  {object}  dto.WorkoutSetResponse
// @Failure      400  {object}  dto.MessageResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets/{setID} [get]
func (h *WorkoutHandler) GetWorkoutSetByID(c *gin.Context) {
	setID := parseUint(c.Param("setID"), 0)
	if setID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Set ID is required"})
		return
	}

	set, err := h.svc.GetWorkoutSetByID(c.Request.Context(), uint(setID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutSetResponse(set))
}
// UpdateWorkoutSet godoc
// @Summary      Update a set
// @Tags         workout-sets
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                        true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                        true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                        true  "Workout ID"      example(100)
// @Param        weID       path      uint                        true  "Workout Exercise ID" example(500)
// @Param        setID      path      uint                        true  "Set ID"          example(700)
// @Param        body       body      dto.WorkoutSetUpdateRequest true  "Fields to update"
// @Success      200        {object}  dto.WorkoutSetResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets/{setID} [patch]
func (h *WorkoutHandler) UpdateWorkoutSet(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weId := parseUint(c.Param("weID"), 0)
	if weId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}
	id := parseUint(c.Param("setID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Set ID is required"})
		return
	}

	var req dto.WorkoutSetUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := dto.BuildUpdatesFromPatchDTO(&req)

	ws, err := h.svc.UpdateWorkoutSet(c.Request.Context(), workoutID, weId, id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutSetResponse(ws))
}
// CompleteWorkoutSet godoc
// @Summary      Mark set completed/skipped
// @Tags         workout-sets
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                         true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                         true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                         true  "Workout ID"      example(100)
// @Param        weID       path      uint                         true  "Workout Exercise ID" example(500)
// @Param        setID      path      uint                         true  "Set ID"          example(700)
// @Param        body       body      dto.WorkoutSetCompleteRequest true "Complete payload"
// @Success      200        {object}  dto.WorkoutSetResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets/{setID}/update-complete [patch]
func (h *WorkoutHandler) CompleteWorkoutSet(c *gin.Context) {
	workoutID := parseUint(c.Param("workoutID"), 0)
	if workoutID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout ID is required"})
		return
	}
	weId := parseUint(c.Param("weID"), 0)
	if weId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}
	id := parseUint(c.Param("setID"), 0)
	if id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Set ID is required"})
		return
	}

	var req dto.WorkoutSetCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ws, err := h.svc.CompleteWorkoutSet(c.Request.Context(), workoutID, weId, id, req.Completed, req.Skipped)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ToWorkoutSetResponse(ws))
}
// MoveWorkoutSet godoc
// @Summary      Move set position
// @Tags         workout-sets
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id         path      uint                      true  "Workout Plan ID" example(1)
// @Param        cycleID    path      uint                      true  "Cycle ID"        example(12)
// @Param        workoutID  path      uint                      true  "Workout ID"      example(100)
// @Param        weID       path      uint                      true  "Workout Exercise ID" example(500)
// @Param        setID      path      uint                      true  "Set ID"          example(700)
// @Param        body       body      dto.WorkoutSetMoveRequest true  "Move payload"
// @Success      200        {object}  dto.MessageResponse
// @Failure      400        {object}  dto.MessageResponse
// @Failure      401        {object}  dto.MessageResponse
// @Failure      500        {object}  dto.MessageResponse
// @Router       /workout-plans/{id}/workout-cycles/{cycleID}/workouts/{workoutID}/workout-exercises/{weID}/workout-sets/{setID}/move [post]
func (h *WorkoutHandler) MoveWorkoutSet(c *gin.Context) {
	weID := parseUint(c.Param("weID"), 0)
	if weID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workout Exercise ID is required"})
		return
	}
	setID := parseUint(c.Param("setID"), 0)
	if setID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Set ID is required"})
		return
	}

	var req dto.WorkoutSetMoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.MoveWorkoutSet(c.Request.Context(), uint(weID), uint(setID), req.Direction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Set moved successfully"})
}

// GetIndividualExercises godoc
// @Summary      List user's individual exercises
// @Tags         individual-exercises
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   dto.IndividualExerciseResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /individual-exercises [get]
func (h *WorkoutHandler) GetIndividualExercises(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	exercises, err := h.svc.GetIndividualExercisesByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	resp := make([]dto.IndividualExerciseResponse, 0, len(exercises))
	for _, e := range exercises {
		resp = append(resp, dto.ToIndividualExerciseResponse(e))
	}

	c.JSON(http.StatusOK, resp)
}

// GetOrCreateIndividualExercise godoc
// @Summary      Get or create an individual exercise
// @Tags         individual-exercises
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.IndividualExerciseCreateOrGetRequest  true  "Create or get payload"
// @Success      200   {object}  dto.IndividualExerciseResponse
// @Failure      400   {object}  dto.MessageResponse
// @Failure      401   {object}  dto.MessageResponse
// @Failure      500   {object}  dto.MessageResponse
// @Router       /individual-exercises [post]
func (h *WorkoutHandler) GetOrCreateIndividualExercise(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	var req dto.IndividualExerciseCreateOrGetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	d := &workout.IndividualExercise{
		UserID:        userID,
		Name:          req.Name,
		IsBodyweight:  req.IsBodyweight,
		IsTimeBased:   req.IsTimeBased,
		MuscleGroupID: req.MuscleGroupID,
		ExerciseID:    req.ExerciseID,
	}

	ie, err := h.svc.GetOrCreateIndividualExercise(c.Request.Context(), d)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToIndividualExerciseResponse(ie))
}

// GetIndividualExercisesStats godoc
// @Summary      Stats for user's individual exercises
// @Tags         individual-exercises
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   dto.IndividualExerciseStatsResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      500  {object}  dto.MessageResponse
// @Router       /individual-exercises/stats [get]
func (h *WorkoutHandler) GetIndividualExercisesStats(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	stats, err := h.svc.GetIndividualExerciseStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]dto.IndividualExerciseStatsResponse, 0, len(stats))
	for _, s := range stats {
		resp = append(resp, dto.ToIndividualExerciseStatsResponse(s))
	}

	c.JSON(http.StatusOK, resp)
}
// GetCurrentWorkoutCycle godoc
// @Summary      Get current workout cycle for user
// @Tags         workout-cycles
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  dto.CurrentCycleResponse
// @Failure      401  {object}  dto.MessageResponse
// @Failure      404  {object}  dto.MessageResponse
// @Router       /current-cycle [get]
func (h *WorkoutHandler) GetCurrentWorkoutCycle(c *gin.Context) {
	userID, exists := currentUserID(c)
	if !exists {
		return
	}

	cycle, err := h.svc.GetCurrentWorkoutCycle(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToCurrentCycleResponse(cycle))
}
