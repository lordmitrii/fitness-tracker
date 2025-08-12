package dto

type ExerciseCreateRequest struct {
	Name          string `json:"name" binding:"required"`
	IsBodyweight  bool   `json:"is_bodyweight"`
	IsTimeBased   bool   `json:"is_time_based"`
	MuscleGroupID *uint  `json:"muscle_group_id"`
}

type ExerciseUpdateRequest struct {
	Name          string `json:"name"`
	IsBodyweight  bool   `json:"is_bodyweight"`
	IsTimeBased   bool   `json:"is_time_based"`
	MuscleGroupID *uint  `json:"muscle_group_id"`
}

type MuscleGroupCreateRequest struct {
	Name string `json:"name" binding:"required"`
}

type MuscleGroupUpdateRequest struct {
	Name string `json:"name"`
}

type MuscleGroupResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type ExerciseResponse struct {
	ID            uint                 `json:"id"`
	Name          string               `json:"name"`
	IsBodyweight  bool                 `json:"is_bodyweight"`
	IsTimeBased   bool                 `json:"is_time_based"`
	MuscleGroupID *uint                `json:"muscle_group_id"`
	MuscleGroup   *MuscleGroupResponse `json:"muscle_group,omitempty"`
	Slug          string               `json:"slug"`
}
