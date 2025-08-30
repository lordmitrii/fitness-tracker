package dto

import (
	"time"
)

type WorkoutPlanCreateRequest struct {
	Name   string `json:"name" binding:"required,max=50"`
	Active bool   `json:"active"`
}
type WorkoutPlanUpdateRequest struct {
	Name           *string `json:"name" binding:"omitempty,max=50"`
	Active         *bool   `json:"active,omitempty"`
	CurrentCycleID *uint   `json:"current_cycle_id" binding:"omitempty"`
}

type SetActiveWorkoutPlanRequest struct {
	Active bool `json:"active" binding:"required"`
}

type WorkoutCycleCreateRequest struct {
	Name       string `json:"name" binding:"required,max=50"`
	WeekNumber int    `json:"week_number" binding:"min=1,max=4294967295"`
}
type WorkoutCycleUpdateRequest struct {
	Name       string `json:"name" binding:"max=50"`
	WeekNumber int    `json:"week_number" binding:"min=1,max=4294967295"`
	Completed  bool   `json:"completed"`
	Skipped    bool   `json:"skipped"`
}

type WorkoutCycleCompleteRequest struct {
	Completed bool `json:"completed"`
	Skipped   bool `json:"skipped"`
}

type WorkoutCreateRequest struct {
	Name  string     `json:"name" binding:"required,max=50"`
	Date  *time.Time `json:"date"`
	Index int        `json:"index"`
}

type WorkoutUpdateRequest struct {
	Name      string     `json:"name" binding:"max=50"`
	Date      *time.Time `json:"date"`
	Index     int        `json:"index"`
	Completed bool       `json:"completed"`
	Skipped   bool       `json:"skipped"`
}

type WorkoutCompleteRequest struct {
	Completed bool `json:"completed"`
	Skipped   bool `json:"skipped"`
}

type WorkoutMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down"`
}

type WorkoutBulkCreateRequest struct {
	Name             string                         `json:"name" binding:"required,max=50"`
	Date             *time.Time                     `json:"date"`
	Index            int                            `json:"index"`
	WorkoutExercises []WorkoutExerciseCreateRequest `json:"workout_exercises"`
}

type WorkoutExerciseCreateRequest struct {
	IndividualExerciseID uint  `json:"individual_exercise_id" binding:"required"`
	Index                int   `json:"index"`
	SetsQt               int64 `json:"sets_qt" binding:"omitempty,min=0,max=20"`
}

type WorkoutExerciseUpdateRequest struct {
	Index     int  `json:"index"`
	Completed bool `json:"completed"`
	Skipped   bool `json:"skipped"`
}

type WorkoutExerciseCompleteRequest struct {
	Completed bool `json:"completed"`
	Skipped   bool `json:"skipped"`
}

type WorkoutExerciseMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down"`
}

type WorkoutExerciseReplaceRequest struct {
	IndividualExerciseID uint  `json:"individual_exercise_id" binding:"required"`
	SetsQt               int64 `json:"sets_qt" binding:"omitempty,min=0,max=20"`
}

type WorkoutSetCreateRequest struct {
	Index          int      `json:"index"`
	Weight         *float64 `json:"weight" binding:"omitempty,min=0,max=2000"`
	Reps           *int     `json:"reps" binding:"omitempty,min=1,max=2000"`
	PreviousWeight *float64 `json:"previous_weight" binding:"omitempty,min=0,max=2000"`
	PreviousReps   *int     `json:"previous_reps" binding:"omitempty,min=1,max=2000"`
}

type WorkoutSetUpdateRequest struct {
	Index     int      `json:"index"`
	Weight    *float64 `json:"weight" binding:"omitempty,min=0,max=2000"`
	Reps      *int     `json:"reps" binding:"omitempty,min=1,max=2000"`
	Completed bool     `json:"completed" binding:"omitempty"`
	Skipped   bool     `json:"skipped" binding:"omitempty"`
}

type WorkoutSetCompleteRequest struct {
	Completed bool `json:"completed"`
	Skipped   bool `json:"skipped"`
}

type WorkoutSetMoveRequest struct {
	Direction string `json:"direction" binding:"required,oneof=up down"`
}

type IndividualExerciseCreateOrGetRequest struct {
	Name          string `json:"name" binding:"max=50"`
	IsBodyweight  bool   `json:"is_bodyweight"`
	IsTimeBased   bool   `json:"is_time_based"`
	MuscleGroupID *uint  `json:"muscle_group_id"`
	ExerciseID    *uint  `json:"exercise_id"`
}

type WorkoutPlanResponse struct {
	ID             uint                   `json:"id,omitempty"`
	Name           string                 `json:"name,omitempty"`
	Active         bool                   `json:"active"`
	UserID         uint                   `json:"user_id,omitempty"`
	CurrentCycleID *uint                  `json:"current_cycle_id,omitempty"`
	WorkoutCycles  []WorkoutCycleResponse `json:"workout_cycles,omitempty"`
	CreatedAt      *time.Time             `json:"created_at"`
	UpdatedAt      *time.Time             `json:"updated_at"`
}

type WorkoutCycleResponse struct {
	ID              uint              `json:"id,omitempty"`
	Name            string            `json:"name,omitempty"`
	WorkoutPlanID   uint              `json:"workout_plan_id,omitempty"`
	WeekNumber      int               `json:"week_number,omitempty"`
	Workouts        []WorkoutResponse `json:"workouts,omitempty"`
	Completed       bool              `json:"completed"`
	Skipped         bool              `json:"skipped"`
	PreviousCycleID *uint             `json:"previous_cycle_id,omitempty"`
	NextCycleID     *uint             `json:"next_cycle_id,omitempty"`
	CreatedAt       *time.Time        `json:"created_at"`
	UpdatedAt       *time.Time        `json:"updated_at"`
}

type WorkoutResponse struct {
	ID                uint                      `json:"id,omitempty"`
	Name              string                    `json:"name,omitempty"`
	WorkoutCycleID    uint                      `json:"workout_cycle_id,omitempty"`
	Date              *time.Time                `json:"date,omitempty"`
	Index             int                       `json:"index,omitempty"`
	Completed         bool                      `json:"completed,omitempty"`
	Skipped           bool                      `json:"skipped,omitempty"`
	PreviousWorkoutID *uint                     `json:"previous_workout_id,omitempty"`
	WorkoutExercises  []WorkoutExerciseResponse `json:"workout_exercises,omitempty"`
	CreatedAt         *time.Time                `json:"created_at"`
	UpdatedAt         *time.Time                `json:"updated_at"`
}

type IndividualExerciseResponse struct {
	ID                             uint                     `json:"id,omitempty"`
	Name                           string                   `json:"name,omitempty"`
	IsBodyweight                   bool                     `json:"is_bodyweight,omitempty"`
	IsTimeBased                    bool                     `json:"is_time_based,omitempty"`
	MuscleGroupID                  *uint                    `json:"muscle_group_id,omitempty"`
	MuscleGroup                    MuscleGroupResponse      `json:"muscle_group"`
	ExerciseID                     *uint                    `json:"exercise_id,omitempty"`
	Exercise                       ExerciseResponse         `json:"exercise"`
	LastCompletedWorkoutExerciseID *uint                    `json:"last_completed_workout_exercise_id,omitempty"`
	LastCompletedWorkoutExercise   *WorkoutExerciseResponse `json:"last_completed_workout_exercise,omitempty"`
	CurrentWeight                  float64                  `json:"current_weight,omitempty"`
	CurrentReps                    int                      `json:"current_reps,omitempty"`
	CreatedAt                      *time.Time               `json:"created_at"`
	UpdatedAt                      *time.Time               `json:"updated_at"`
}

type WorkoutExerciseResponse struct {
	ID                   uint                        `json:"id,omitempty"`
	WorkoutID            uint                        `json:"workout_id,omitempty"`
	Index                int                         `json:"index,omitempty"`
	IndividualExerciseID uint                        `json:"individual_exercise_id,omitempty"`
	IndividualExercise   *IndividualExerciseResponse `json:"individual_exercise,omitempty"`
	WorkoutSets          []WorkoutSetResponse        `json:"workout_sets,omitempty"`
	PreviousExerciseID   *uint                       `json:"previous_exercise_id,omitempty"`
	Completed            bool                        `json:"completed,omitempty"`
	Skipped              bool                        `json:"skipped,omitempty"`
	SetsQt               int64                       `json:"sets_qt,omitempty"`
	CreatedAt            *time.Time                  `json:"created_at"`
	UpdatedAt            *time.Time                  `json:"updated_at"`
}

type WorkoutSetResponse struct {
	ID                uint       `json:"id,omitempty"`
	WorkoutExerciseID uint       `json:"workout_exercise_id,omitempty"`
	Index             int        `json:"index,omitempty"`
	Completed         bool       `json:"completed,omitempty"`
	Skipped           bool       `json:"skipped,omitempty"`
	Weight            *float64   `json:"weight,omitempty"`
	Reps              *int       `json:"reps,omitempty"`
	PreviousWeight    *float64   `json:"previous_weight,omitempty"`
	PreviousReps      *int       `json:"previous_reps,omitempty"`
	CreatedAt         *time.Time `json:"created_at"`
	UpdatedAt         *time.Time `json:"updated_at"`
}

type IndividualExerciseStatsResponse struct {
	ID           uint   `json:"id,omitempty"`
	Name         string `json:"name,omitempty"`
	IsBodyweight bool   `json:"is_bodyweight,omitempty"`
	IsTimeBased  bool   `json:"is_time_based,omitempty"`

	MuscleGroupID *uint               `json:"muscle_group_id,omitempty"`
	MuscleGroup   MuscleGroupResponse `json:"muscle_group"`
	ExerciseID    *uint               `json:"exercise_id,omitempty"`
	Exercise      ExerciseResponse    `json:"exercise"`

	CurrentWeight float64 `json:"current_weight,omitempty"`
	CurrentReps   int     `json:"current_reps,omitempty"`

	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type CurrentCycleResponse struct {
	ID            uint `json:"id,omitempty"`
	WorkoutPlanID uint `json:"workout_plan_id,omitempty"`
}
