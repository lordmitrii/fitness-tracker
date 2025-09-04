package dto

type ExerciseCreateRequest struct {
	Name          string `json:"name" binding:"required,max=50"`
	IsBodyweight  bool   `json:"is_bodyweight"`
	IsTimeBased   bool   `json:"is_time_based"`
	MuscleGroupID *uint  `json:"muscle_group_id"`
}

type ExerciseUpdateRequest struct {
	Name          *string `json:"name" binding:"omitempty,max=50"`
	IsBodyweight  *bool   `json:"is_bodyweight" binding:"omitempty"`
	IsTimeBased   *bool   `json:"is_time_based" binding:"omitempty"`
	MuscleGroupID *uint    `json:"muscle_group_id" binding:"omitempty"`
}

type MuscleGroupCreateRequest struct {
	Name string `json:"name" binding:"required,max=50"`
}

type MuscleGroupUpdateRequest struct {
	Name *string `json:"name" binding:"omitempty,max=50"`
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
