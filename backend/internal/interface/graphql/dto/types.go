package dto

import "time"

type WorkoutPlanCreateRequest struct {
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

type WorkoutPlanUpdateRequest struct {
	Name           *string `json:"name" db:"name"`
	Active         *bool   `json:"active" db:"active"`
	CurrentCycleID *uint   `json:"currentCycleId" db:"current_cycle_id"`
}

type WorkoutCycleCreateRequest struct {
	Name       string `json:"name"`
	WeekNumber int    `json:"weekNumber" db:"week_number"`
}

type WorkoutCycleUpdateRequest struct {
	Name       *string `json:"name" db:"name"`
	WeekNumber *int    `json:"weekNumber" db:"week_number"`
	Completed  *bool   `json:"completed" db:"completed"`
	Skipped    *bool   `json:"skipped" db:"skipped"`
}

type WorkoutCreateRequest struct {
	Name  string     `json:"name"`
	Date  *time.Time `json:"date"`
	Index int        `json:"index" db:"index"`
}

type WorkoutUpdateRequest struct {
	Name      *string    `json:"name" db:"name"`
	Date      *time.Time `json:"date" db:"date"`
	Index     *int       `json:"index" db:"index"`
	Completed *bool      `json:"completed" db:"completed"`
	Skipped   *bool      `json:"skipped" db:"skipped"`
}

type WorkoutExerciseCreateRequest struct {
	IndividualExerciseID uint  `json:"individualExerciseId"`
	Index                int   `json:"index" db:"index"`
	SetsQt               int64 `json:"setsQt" db:"sets_qt"`
}

type WorkoutExerciseUpdateRequest struct {
	Index     *int  `json:"index" db:"index"`
	Completed *bool `json:"completed" db:"completed"`
	Skipped   *bool `json:"skipped" db:"skipped"`
}

type WorkoutSetCreateRequest struct {
	Index          int  `json:"index" db:"index"`
	Weight         *int `json:"weight" db:"weight"`
	Reps           *int `json:"reps" db:"reps"`
	PreviousWeight *int `json:"previousWeight" db:"previous_weight"`
	PreviousReps   *int `json:"previousReps" db:"previous_reps"`
}

type WorkoutSetUpdateRequest struct {
	Index     *int  `json:"index" db:"index"`
	Weight    *int  `json:"weight" db:"weight"`
	Reps      *int  `json:"reps" db:"reps"`
	Completed *bool `json:"completed" db:"completed"`
	Skipped   *bool `json:"skipped" db:"skipped"`
}

type IndividualExerciseCreateOrGetRequest struct {
	Name          string `json:"name"`
	IsBodyweight  bool   `json:"isBodyweight" db:"is_bodyweight"`
	IsTimeBased   bool   `json:"isTimeBased" db:"is_time_based"`
	MuscleGroupID *uint  `json:"muscleGroupId" db:"muscle_group_id"`
	ExerciseID    *uint  `json:"exerciseId" db:"exercise_id"`
}

type WorkoutPlanResponse struct {
	ID             uint                   `json:"id,omitempty"`
	Name           string                 `json:"name,omitempty"`
	Active         bool                   `json:"active"`
	UserID         uint                   `json:"userId,omitempty"`
	CurrentCycleID *uint                  `json:"currentCycleId,omitempty"`
	WorkoutCycles  []WorkoutCycleResponse `json:"workoutCycles,omitempty"`
	CreatedAt      *time.Time             `json:"createdAt"`
	UpdatedAt      *time.Time             `json:"updatedAt"`
}

type WorkoutCycleResponse struct {
	ID              uint              `json:"id,omitempty"`
	Name            string            `json:"name,omitempty"`
	WorkoutPlanID   uint              `json:"workoutPlanId,omitempty"`
	WeekNumber      int               `json:"weekNumber,omitempty"`
	Workouts        []WorkoutResponse `json:"workouts,omitempty"`
	Completed       bool              `json:"completed"`
	Skipped         bool              `json:"skipped"`
	PreviousCycleID *uint             `json:"previousCycleId,omitempty"`
	NextCycleID     *uint             `json:"nextCycleId,omitempty"`
	CreatedAt       *time.Time        `json:"createdAt"`
	UpdatedAt       *time.Time        `json:"updatedAt"`
}

type WorkoutResponse struct {
	ID                 uint                      `json:"id,omitempty"`
	Name               string                    `json:"name,omitempty"`
	WorkoutCycleID     uint                      `json:"workoutCycleId,omitempty"`
	Date               *time.Time                `json:"date,omitempty"`
	Index              int                       `json:"index,omitempty"`
	Completed          bool                      `json:"completed,omitempty"`
	Skipped            bool                      `json:"skipped,omitempty"`
	PreviousWorkoutID  *uint                     `json:"previousWorkoutId,omitempty"`
	WorkoutExercises   []WorkoutExerciseResponse `json:"workoutExercises,omitempty"`
	CreatedAt          *time.Time                `json:"createdAt"`
	UpdatedAt          *time.Time                `json:"updatedAt"`
	EstimatedCalories  float64                   `json:"estimatedCalories,omitempty"`
	EstimatedActiveMin float64                   `json:"estimatedActiveMin,omitempty"`
	EstimatedRestMin   float64                   `json:"estimatedRestMin,omitempty"`
}

type IndividualExerciseResponse struct {
	ID                             uint                     `json:"id,omitempty"`
	Name                           string                   `json:"name,omitempty"`
	IsBodyweight                   bool                     `json:"isBodyweight,omitempty"`
	IsTimeBased                    bool                     `json:"isTimeBased,omitempty"`
	MuscleGroupID                  *uint                    `json:"muscleGroupId,omitempty"`
	MuscleGroup                    MuscleGroupResponse      `json:"muscleGroup"`
	ExerciseID                     *uint                    `json:"exerciseId,omitempty"`
	Exercise                       ExerciseResponse         `json:"exercise"`
	LastCompletedWorkoutExerciseID *uint                    `json:"lastCompletedWorkoutExerciseId,omitempty"`
	LastCompletedWorkoutExercise   *WorkoutExerciseResponse `json:"lastCompletedWorkoutExercise,omitempty"`
	CurrentWeight                  int                      `json:"currentWeight,omitempty"`
	CurrentReps                    int                      `json:"currentReps,omitempty"`
	CreatedAt                      *time.Time               `json:"createdAt"`
	UpdatedAt                      *time.Time               `json:"updatedAt"`
}

type WorkoutExerciseResponse struct {
	ID                   uint                        `json:"id,omitempty"`
	WorkoutID            uint                        `json:"workoutId,omitempty"`
	Index                int                         `json:"index,omitempty"`
	IndividualExerciseID uint                        `json:"individualExerciseId,omitempty"`
	IndividualExercise   *IndividualExerciseResponse `json:"individualExercise,omitempty"`
	WorkoutSets          []WorkoutSetResponse        `json:"workoutSets,omitempty"`
	PreviousExerciseID   *uint                       `json:"previousExerciseId,omitempty"`
	Completed            bool                        `json:"completed,omitempty"`
	Skipped              bool                        `json:"skipped,omitempty"`
	SetsQt               int64                       `json:"setsQt,omitempty"`
	CreatedAt            *time.Time                  `json:"createdAt"`
	UpdatedAt            *time.Time                  `json:"updatedAt"`
}

type WorkoutSetResponse struct {
	ID                uint       `json:"id,omitempty"`
	WorkoutExerciseID uint       `json:"workoutExerciseId,omitempty"`
	Index             int        `json:"index,omitempty"`
	Completed         bool       `json:"completed,omitempty"`
	Skipped           bool       `json:"skipped,omitempty"`
	Weight            *int       `json:"weight,omitempty"`
	Reps              *int       `json:"reps,omitempty"`
	PreviousWeight    *int       `json:"previousWeight,omitempty"`
	PreviousReps      *int       `json:"previousReps,omitempty"`
	CreatedAt         *time.Time `json:"createdAt"`
	UpdatedAt         *time.Time `json:"updatedAt"`
}

type MuscleGroupResponse struct {
	ID   uint   `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	Slug string `json:"slug,omitempty"`
}

type ExerciseResponse struct {
	ID            uint                 `json:"id,omitempty"`
	Name          string               `json:"name,omitempty"`
	Slug          string               `json:"slug,omitempty"`
	IsBodyweight  bool                 `json:"isBodyweight,omitempty"`
	IsTimeBased   bool                 `json:"isTimeBased,omitempty"`
	MuscleGroupID *uint                `json:"muscleGroupId,omitempty"`
	MuscleGroup   *MuscleGroupResponse `json:"muscleGroup,omitempty"`
}

type WorkoutCompleteResponse struct {
	Workout           WorkoutResponse `json:"workout"`
	EstimatedCalories float64         `json:"estimatedCalories,omitempty"`
}

type WorkoutExerciseCompleteResponse struct {
	WorkoutExercise   WorkoutExerciseResponse `json:"workoutExercise"`
	EstimatedCalories float64                 `json:"estimatedCalories,omitempty"`
}

type WorkoutSetCompleteResponse struct {
	WorkoutSet        WorkoutSetResponse `json:"workoutSet"`
	EstimatedCalories float64            `json:"estimatedCalories,omitempty"`
}

type WorkoutExerciseDeleteResponse struct {
	EstimatedCalories float64 `json:"estimatedCalories,omitempty"`
}

type SetDeleteResponse struct {
	EstimatedCalories float64 `json:"estimatedCalories,omitempty"`
}
