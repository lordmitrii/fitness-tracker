package dto

import "time"

// swagger:model
type WorkoutPlanCreateRequest struct {
	Name   string `json:"name"   binding:"required,max=50" example:"Push/Pull/Legs"`
	Active bool   `json:"active"                         example:"true"`
}

// swagger:model
type WorkoutPlanUpdateRequest struct {
	Name           *string `json:"name"             binding:"omitempty,max=50" example:"PPL Advanced"`
	Active         *bool   `json:"active"           binding:"omitempty"        example:"false"`
	CurrentCycleID *uint   `json:"current_cycle_id" binding:"omitempty"        example:"12"`
}

// swagger:model
type SetActiveWorkoutPlanRequest struct {
	Active bool `json:"active" binding:"required" example:"true"`
}

// swagger:model
type WorkoutCycleCreateRequest struct {
	Name       string `json:"name"        binding:"required,max=50" example:"Week 1"`
	WeekNumber int    `json:"week_number" binding:"min=1,max=4294967295" example:"1"`
}

// swagger:model
type WorkoutCycleUpdateRequest struct {
	Name       *string `json:"name"        binding:"omitempty,max=50"          example:"Week 1 (deload)"`
	WeekNumber *int    `json:"week_number" binding:"omitempty,min=1,max=4294967295" example:"2"`
	Completed  *bool   `json:"completed"   binding:"omitempty"                 example:"false"`
	Skipped    *bool   `json:"skipped"     binding:"omitempty"                 example:"false"`
}

// swagger:model
type WorkoutCycleCompleteRequest struct {
	Completed bool `json:"completed" example:"true"`
	Skipped   bool `json:"skipped"   example:"false"`
}

// swagger:model
type WorkoutCreateRequest struct {
	Name  string     `json:"name"  binding:"required,max=50" example:"Upper Body A"`
	Date  *time.Time `json:"date"                           example:"2025-09-25T10:00:00Z"`
	Index int        `json:"index"                          example:"1"`
}

// swagger:model
type WorkoutUpdateRequest struct {
	Name      *string    `json:"name"      binding:"omitempty,max=50" example:"Upper Body B"`
	Date      *time.Time `json:"date"      binding:"omitempty"        example:"2025-09-26T10:00:00Z"`
	Index     *int       `json:"index"     binding:"omitempty"        example:"2"`
	Completed *bool      `json:"completed" binding:"omitempty"        example:"true"`
	Skipped   *bool      `json:"skipped"   binding:"omitempty"        example:"false"`
}

// swagger:model
type WorkoutCompleteRequest struct {
	Completed bool `json:"completed" example:"true"`
	Skipped   bool `json:"skipped"   example:"false"`
}

// swagger:model
type WorkoutMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down" example:"up"`
}

// swagger:model
type WorkoutBulkCreateRequest struct {
	Name             string                         `json:"name"  binding:"required,max=50" example:"Leg Day"`
	Date             *time.Time                     `json:"date"                           example:"2025-09-27T10:00:00Z"`
	Index            int                            `json:"index"                          example:"1"`
	WorkoutExercises []WorkoutExerciseCreateRequest `json:"workout_exercises"`
}

// swagger:model
type WorkoutExerciseCreateRequest struct {
	IndividualExerciseID uint  `json:"individual_exercise_id" binding:"required"         example:"101"`
	Index                int   `json:"index"                                               example:"1"`
	SetsQt               int64 `json:"sets_qt"          binding:"omitempty,min=0,max=20"  example:"4"`
}

// swagger:model
type WorkoutExerciseUpdateRequest struct {
	Index     *int  `json:"index"     binding:"omitempty" example:"2"`
	Completed *bool `json:"completed" binding:"omitempty" example:"true"`
	Skipped   *bool `json:"skipped"   binding:"omitempty" example:"false"`
}

// swagger:model
type WorkoutExerciseCompleteRequest struct {
	Completed bool `json:"completed" example:"true"`
	Skipped   bool `json:"skipped"   example:"false"`
}

// swagger:model
type WorkoutExerciseMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down" example:"down"`
}

// swagger:model
type WorkoutExerciseReplaceRequest struct {
	IndividualExerciseID uint  `json:"individual_exercise_id" binding:"required"        example:"202"`
	SetsQt               int64 `json:"sets_qt"              binding:"omitempty,min=0,max=20" example:"3"`
}

// swagger:model
type WorkoutSetCreateRequest struct {
	Index          int  `json:"index"                                     example:"1"`
	Weight         *int `json:"weight"           binding:"omitempty,min=0,max=2000000" example:"60000"`
	Reps           *int `json:"reps"             binding:"omitempty,min=1,max=2000"    example:"10"`
	PreviousWeight *int `json:"previous_weight"  binding:"omitempty,min=0,max=2000000" example:"55000"`
	PreviousReps   *int `json:"previous_reps"    binding:"omitempty,min=1,max=2000"    example:"9"`
}

// swagger:model
type WorkoutSetUpdateRequest struct {
	Index     *int  `json:"index"     binding:"omitempty"                    example:"2"`
	Weight    *int  `json:"weight"    binding:"omitempty,min=0,max=2000000"  example:"62000"`
	Reps      *int  `json:"reps"      binding:"omitempty,min=1,max=2000"     example:"8"`
	Completed *bool `json:"completed" binding:"omitempty"                    example:"true"`
	Skipped   *bool `json:"skipped"   binding:"omitempty"                    example:"false"`
}

// swagger:model
type WorkoutSetCompleteRequest struct {
	Completed bool `json:"completed" example:"true"`
	Skipped   bool `json:"skipped"   example:"false"`
}

// swagger:model
type WorkoutSetMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down" example:"up"`
}

// swagger:model
type IndividualExerciseCreateOrGetRequest struct {
	Name          string `json:"name"            binding:"max=50"    example:"Dumbbell Row"`
	IsBodyweight  bool   `json:"is_bodyweight"                         example:"false"`
	IsTimeBased   bool   `json:"is_time_based"                          example:"false"`
	MuscleGroupID *uint  `json:"muscle_group_id"                        example:"3"`
	ExerciseID    *uint  `json:"exercise_id"                            example:"12"`
}

// swagger:model
type WorkoutPlanResponse struct {
	ID             uint                   `json:"id,omitempty"              example:"1"`
	Name           string                 `json:"name,omitempty"            example:"Push/Pull/Legs"`
	Active         bool                   `json:"active"                    example:"true"`
	UserID         uint                   `json:"user_id,omitempty"         example:"42"`
	CurrentCycleID *uint                  `json:"current_cycle_id,omitempty" example:"12"`
	WorkoutCycles  []WorkoutCycleResponse `json:"workout_cycles,omitempty"`
	CreatedAt      *time.Time             `json:"created_at"                example:"2025-09-20T12:34:56Z"`
	UpdatedAt      *time.Time             `json:"updated_at"                example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type WorkoutCycleResponse struct {
	ID              uint              `json:"id,omitempty"            example:"12"`
	Name            string            `json:"name,omitempty"          example:"Week 1"`
	WorkoutPlanID   uint              `json:"workout_plan_id,omitempty" example:"1"`
	WeekNumber      int               `json:"week_number,omitempty"   example:"1"`
	Workouts        []WorkoutResponse `json:"workouts,omitempty"`
	Completed       bool              `json:"completed"               example:"false"`
	Skipped         bool              `json:"skipped"                 example:"false"`
	PreviousCycleID *uint             `json:"previous_cycle_id,omitempty" example:"11"`
	NextCycleID     *uint             `json:"next_cycle_id,omitempty" example:"13"`
	CreatedAt       *time.Time        `json:"created_at"              example:"2025-09-20T12:34:56Z"`
	UpdatedAt       *time.Time        `json:"updated_at"              example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type WorkoutResponse struct {
	ID                 uint                      `json:"id,omitempty"                 example:"100"`
	Name               string                    `json:"name,omitempty"               example:"Upper Body A"`
	WorkoutCycleID     uint                      `json:"workout_cycle_id,omitempty"   example:"12"`
	Date               *time.Time                `json:"date,omitempty"               example:"2025-09-25T10:00:00Z"`
	Index              int                       `json:"index,omitempty"              example:"1"`
	Completed          bool                      `json:"completed,omitempty"          example:"true"`
	Skipped            bool                      `json:"skipped,omitempty"            example:"false"`
	PreviousWorkoutID  *uint                     `json:"previous_workout_id,omitempty" example:"99"`
	WorkoutExercises   []WorkoutExerciseResponse `json:"workout_exercises,omitempty"`
	CreatedAt          *time.Time                `json:"created_at"                   example:"2025-09-20T12:34:56Z"`
	UpdatedAt          *time.Time                `json:"updated_at"                   example:"2025-09-25T12:34:56Z"`
	EstimatedCalories  float64                   `json:"estimated_calories,omitempty" example:"200.5"`
	EstimatedActiveMin float64                   `json:"estimated_active_min,omitempty" example:"10.0"`
	EstimatedRestMin   float64                   `json:"estimated_rest_min,omitempty" example:"30.0"`
}

// swagger:model
type IndividualExerciseResponse struct {
	ID                             uint                     `json:"id,omitempty"                            example:"101"`
	Name                           string                   `json:"name,omitempty"                          example:"Dumbbell Row"`
	IsBodyweight                   bool                     `json:"is_bodyweight,omitempty"                 example:"false"`
	IsTimeBased                    bool                     `json:"is_time_based,omitempty"                 example:"false"`
	MuscleGroupID                  *uint                    `json:"muscle_group_id,omitempty"               example:"3"`
	MuscleGroup                    MuscleGroupResponse      `json:"muscle_group"`
	ExerciseID                     *uint                    `json:"exercise_id,omitempty"                   example:"12"`
	Exercise                       ExerciseResponse         `json:"exercise"`
	LastCompletedWorkoutExerciseID *uint                    `json:"last_completed_workout_exercise_id,omitempty" example:"555"`
	LastCompletedWorkoutExercise   *WorkoutExerciseResponse `json:"last_completed_workout_exercise,omitempty"`
	CurrentWeight                  int                      `json:"current_weight,omitempty"                example:"60000"`
	CurrentReps                    int                      `json:"current_reps,omitempty"                  example:"10"`
	CreatedAt                      *time.Time               `json:"created_at"                              example:"2025-09-20T12:34:56Z"`
	UpdatedAt                      *time.Time               `json:"updated_at"                              example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type WorkoutExerciseResponse struct {
	ID                   uint                        `json:"id,omitempty"                   example:"500"`
	WorkoutID            uint                        `json:"workout_id,omitempty"           example:"100"`
	Index                int                         `json:"index,omitempty"                example:"1"`
	IndividualExerciseID uint                        `json:"individual_exercise_id,omitempty" example:"101"`
	IndividualExercise   *IndividualExerciseResponse `json:"individual_exercise,omitempty"`
	WorkoutSets          []WorkoutSetResponse        `json:"workout_sets,omitempty"`
	PreviousExerciseID   *uint                       `json:"previous_exercise_id,omitempty" example:"480"`
	Completed            bool                        `json:"completed,omitempty"            example:"true"`
	Skipped              bool                        `json:"skipped,omitempty"              example:"false"`
	SetsQt               int64                       `json:"sets_qt,omitempty"              example:"3"`
	CreatedAt            *time.Time                  `json:"created_at"                     example:"2025-09-20T12:34:56Z"`
	UpdatedAt            *time.Time                  `json:"updated_at"                     example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type WorkoutSetResponse struct {
	ID                uint       `json:"id,omitempty"                  example:"700"`
	WorkoutExerciseID uint       `json:"workout_exercise_id,omitempty" example:"500"`
	Index             int        `json:"index,omitempty"               example:"1"`
	Completed         bool       `json:"completed,omitempty"           example:"true"`
	Skipped           bool       `json:"skipped,omitempty"             example:"false"`
	Weight            *int       `json:"weight,omitempty"              example:"60000"`
	Reps              *int       `json:"reps,omitempty"                example:"10"`
	PreviousWeight    *int       `json:"previous_weight,omitempty"     example:"55000"`
	PreviousReps      *int       `json:"previous_reps,omitempty"       example:"9"`
	CreatedAt         *time.Time `json:"created_at"                    example:"2025-09-20T12:34:56Z"`
	UpdatedAt         *time.Time `json:"updated_at"                    example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type IndividualExerciseStatsResponse struct {
	ID            uint                `json:"id,omitempty"           example:"101"`
	Name          string              `json:"name,omitempty"         example:"Dumbbell Row"`
	IsBodyweight  bool                `json:"is_bodyweight,omitempty" example:"false"`
	IsTimeBased   bool                `json:"is_time_based,omitempty" example:"false"`
	MuscleGroupID *uint               `json:"muscle_group_id,omitempty" example:"3"`
	MuscleGroup   MuscleGroupResponse `json:"muscle_group"`
	ExerciseID    *uint               `json:"exercise_id,omitempty"    example:"12"`
	Exercise      ExerciseResponse    `json:"exercise"`
	CurrentWeight int                 `json:"current_weight,omitempty" example:"60000"`
	CurrentReps   int                 `json:"current_reps,omitempty"   example:"10"`
	CreatedAt     *time.Time          `json:"created_at" example:"2025-09-20T12:34:56Z"`
	UpdatedAt     *time.Time          `json:"updated_at" example:"2025-09-25T12:34:56Z"`
}

// swagger:model
type ExercisePerformanceResponse struct {
	CompletedAt *time.Time `json:"completed_at,omitempty" example:"2025-09-20T12:34:56Z"`
	Weight      *int       `json:"weight,omitempty" example:"60000"`
	Reps        *int       `json:"reps,omitempty" example:"10"`
}

// swagger:model
type CurrentCycleResponse struct {
	ID            uint `json:"id,omitempty"             example:"12"`
	WorkoutPlanID uint `json:"workout_plan_id,omitempty" example:"1"`
}

// swagger:model
type WorkoutCompleteResponse struct {
	Workout           WorkoutResponse `json:"workout"`
	EstimatedCalories float64         `json:"estimated_calories,omitempty" example:"200.5"`
}

// swagger:model
type WorkoutExerciseCompleteResponse struct {
	WorkoutExercise   WorkoutExerciseResponse `json:"workout_exercise"`
	EstimatedCalories float64                 `json:"estimated_calories,omitempty" example:"50.0"`
}

// swagger:model
type WorkoutSetCompleteResponse struct {
	WorkoutSet        WorkoutSetResponse `json:"workout_set"`
	EstimatedCalories float64            `json:"estimated_calories,omitempty" example:"50.0"`
}

// swagger:model
type WorkoutExerciseDeleteResponse struct {
	EstimatedCalories float64 `json:"estimated_calories,omitempty" example:"100.2"`
}

// swagger:model
type SetDeleteResponse struct {
	EstimatedCalories float64 `json:"estimated_calories,omitempty" example:"203.0"`
}
