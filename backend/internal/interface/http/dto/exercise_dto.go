package dto

// swagger:model
type ExerciseCreateRequest struct {
	Name          string `json:"name"             binding:"required,max=50" example:"Bench Press"`
	IsBodyweight  bool   `json:"is_bodyweight"                                example:"false"`
	IsTimeBased   bool   `json:"is_time_based"                                 example:"false"`
	MuscleGroupID *uint  `json:"muscle_group_id"                               example:"3"`
	AutoTranslate bool   `json:"auto_translate"                                example:"true"`
}

// swagger:model
type ExerciseUpdateRequest struct {
	Name          *string `json:"name"             binding:"omitempty,max=50" example:"Incline Bench Press"`
	IsBodyweight  *bool   `json:"is_bodyweight"    binding:"omitempty"        example:"false"`
	IsTimeBased   *bool   `json:"is_time_based"    binding:"omitempty"        example:"false"`
	MuscleGroupID *uint   `json:"muscle_group_id"  binding:"omitempty"        example:"4"`
}

// swagger:model
type MuscleGroupCreateRequest struct {
	Name          string `json:"name"           binding:"required,max=50" example:"Chest"`
	AutoTranslate bool   `json:"auto_translate"                          example:"true"`
}

// swagger:model
type MuscleGroupUpdateRequest struct {
	Name *string `json:"name" binding:"omitempty,max=50" example:"Upper Chest"`
}

// swagger:model
type MuscleGroupResponse struct {
	ID   uint   `json:"id"   example:"3"`
	Name string `json:"name" example:"Chest"`
	Slug string `json:"slug" example:"chest"`
}

// swagger:model
type ExerciseResponse struct {
	ID            uint                 `json:"id"              example:"12"`
	Name          string               `json:"name"            example:"Bench Press"`
	IsBodyweight  bool                 `json:"is_bodyweight"   example:"false"`
	IsTimeBased   bool                 `json:"is_time_based"   example:"false"`
	MuscleGroupID *uint                `json:"muscle_group_id" example:"3"`
	MuscleGroup   *MuscleGroupResponse `json:"muscle_group,omitempty"`
	Slug          string               `json:"slug"            example:"bench-press"`
}
