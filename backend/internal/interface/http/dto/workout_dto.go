package dto

import (
	"time"
)

type WorkoutPlanCreateRequest struct {
	Name   string `json:"name" binding:"required,max=50"`
	Active bool   `json:"active"`
}
type WorkoutPlanUpdateRequest struct {
	Name           string `json:"name" binding:"max=50"`
	Active         bool   `json:"active"`
	CurrentCycleID uint   `json:"current_cycle_id" binding:"omitempty"`
}

type SetActiveWorkoutPlanRequest struct {
	Active bool `json:"active"`
}

type WorkoutCycleCreateRequest struct {
	Name       string `json:"name" binding:"required,max=50"`
	WeekNumber int    `json:"week_number" binding:"min=1,max=4294967295"`
}
type WorkoutCycleUpdateRequest struct {
	Name       string `json:"name" binding:"max=50"`
	WeekNumber int    `json:"week_number" binding:"min=1,max=4294967295"`
	Completed  bool   `json:"completed"`
}

type WorkoutCycleCompleteRequest struct {
	Completed bool `json:"completed"`
}

type WorkoutCreateRequest struct {
	Name  string    `json:"name" binding:"required,max=50"`
	Date  time.Time `json:"date"`
	Index int       `json:"index"`
}

type WorkoutUpdateRequest struct {
	Name      string    `json:"name" binding:"max=50"`
	Date      time.Time `json:"date"`
	Index     int       `json:"index"`
	Completed bool      `json:"completed"`
}

type WorkoutBulkCreateRequest struct {
	Name             string                         `json:"name" binding:"required,max=50"`
	Date             time.Time                      `json:"date"`
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
}

type WorkoutExerciseCompleteRequest struct {
	Completed bool `json:"completed"`
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
	Completed bool     `json:"completed"`
	Skipped   bool     `json:"skipped"`
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
	ID             uint                   `json:"id"`
	Name           string                 `json:"name"`
	Active         bool                   `json:"active"`
	UserID         uint                   `json:"user_id"`
	CurrentCycleID uint                   `json:"current_cycle_id"`
	WorkoutCycles  []WorkoutCycleResponse `json:"workout_cycle"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

type WorkoutCycleResponse struct {
	ID              uint              `json:"id"`
	Name            string            `json:"name"`
	WorkoutPlanID   uint              `json:"workout_plan_id"`
	WeekNumber      int               `json:"week_number"`
	Workouts        []WorkoutResponse `json:"workouts"`
	Completed       bool              `json:"completed"`
	PreviousCycleID uint              `json:"previous_cycle_id" binding:"omitempty"`
	NextCycleID     uint              `json:"next_cycle_id" binding:"omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

type WorkoutResponse struct {
	ID                uint                      `json:"id"`
	Name              string                    `json:"name"`
	WorkoutCycleID    uint                      `json:"workout_cycle_id"`
	Date              time.Time                 `json:"date"`
	Index             int                       `json:"index"`
	Completed         bool                      `json:"completed"`
	PreviousWorkoutID uint                      `json:"previous_workout_id"`
	WorkoutExercises  []WorkoutExerciseResponse `json:"workout_exercises"`
	CreatedAt         time.Time                 `json:"created_at"`
	UpdatedAt         time.Time                 `json:"updated_at"`
}

type IndividualExerciseResponse struct {
	ID                             uint                    `json:"id"`
	Name                           string                  `json:"name"`
	IsBodyweight                   bool                    `json:"is_bodyweight"`
	IsTimeBased                    bool                    `json:"is_time_based"`
	MuscleGroupID                  *uint                   `json:"muscle_group_id"`
	MuscleGroup                    MuscleGroupResponse     `json:"muscle_group"`
	ExerciseID                     *uint                   `json:"exercise_id"`
	Exercise                       ExerciseResponse        `json:"exercise"`
	LastCompletedWorkoutExerciseID *uint                   `json:"last_completed_workout_exercise_id"`
	LastCompletedWorkoutExercise   WorkoutExerciseResponse `json:"last_completed_workout_exercise"`
	CurrentWeight                  float64                 `json:"current_weight"`
	CurrentReps                    int                     `json:"current_reps"`
	CreatedAt                      time.Time               `json:"created_at"`
	UpdatedAt                      time.Time               `json:"updated_at"`
}

type WorkoutExerciseResponse struct {
	ID                   uint                        `json:"id"`
	WorkoutID            uint                        `json:"workout_id"`
	Index                int                         `json:"index"`
	IndividualExerciseID uint                        `json:"individual_exercise_id"`
	IndividualExercise   *IndividualExerciseResponse `json:"individual_exercise"`
	WorkoutSets          []WorkoutSetResponse        `json:"workout_sets"`
	Completed            bool                        `json:"completed"`
	SetsQt               int64                       `json:"sets_qt"`
	CreatedAt            time.Time                   `json:"created_at"`
	UpdatedAt            time.Time                   `json:"updated_at"`
}

type WorkoutSetResponse struct {
	ID                uint      `json:"id"`
	WorkoutExerciseID uint      `json:"workout_exercise_id"`
	Index             int       `json:"index"`
	Completed         bool      `json:"completed"`
	Skipped           bool      `json:"skipped"`
	Weight            *float64  `json:"weight" binding:"omitempty"`
	Reps              *int      `json:"reps" binding:"omitempty"`
	PreviousWeight    *float64  `json:"previous_weight" binding:"omitempty"`
	PreviousReps      *int      `json:"previous_reps" binding:"omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type IndividualExerciseStatsResponse struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	IsBodyweight bool   `json:"is_bodyweight"`
	IsTimeBased  bool   `json:"is_time_based"`

	MuscleGroupID *uint               `json:"muscle_group_id"`
	MuscleGroup   MuscleGroupResponse `json:"muscle_group"`
	ExerciseID    *uint               `json:"exercise_id"`
	Exercise      ExerciseResponse    `json:"exercise"`

	CurrentWeight float64 `json:"current_weight"`
	CurrentReps   int     `json:"current_reps"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
