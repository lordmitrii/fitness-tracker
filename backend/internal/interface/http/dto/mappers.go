package dto

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func ToProfileResponse(p *user.Profile) ProfileResponse {
	return ProfileResponse{
		Age:       p.Age,
		HeightCm:  p.HeightCm,
		WeightKg:  p.WeightKg,
		Sex:       p.Sex,
		UpdatedAt: p.UpdatedAt,
		CreatedAt: p.CreatedAt,
	}
}

func ToConsentResponse(cns *user.UserConsent) ConsentResponse {
	return ConsentResponse{
		ID:        cns.ID,
		UserID:    cns.UserID,
		Type:      cns.Type,
		Version:   cns.Version,
		Given:     cns.Given,
		CreatedAt: cns.CreatedAt,
		UpdatedAt: cns.UpdatedAt,
	}
}

func ToRoleResponses(roles []rbac.Role) []RoleResponse {
	resp := make([]RoleResponse, 0, len(roles))
	for _, r := range roles {
		resp = append(resp, RoleResponse{ID: r.ID, Name: r.Name})
	}
	return resp
}

func ToExerciseResponse(e *workout.Exercise) ExerciseResponse {
	var mg *MuscleGroupResponse
	if e.MuscleGroup != nil {
		mg = &MuscleGroupResponse{
			ID:   e.MuscleGroup.ID,
			Name: e.MuscleGroup.Name,
			Slug: e.MuscleGroup.Slug,
		}
	}
	return ExerciseResponse{
		ID:            e.ID,
		Name:          e.Name,
		IsBodyweight:  e.IsBodyweight,
		IsTimeBased:   e.IsTimeBased,
		MuscleGroupID: e.MuscleGroupID,
		MuscleGroup:   mg,
		Slug:          e.Slug,
	}
}

func ToMuscleGroupResponse(m *workout.MuscleGroup) MuscleGroupResponse {
	return MuscleGroupResponse{
		ID:   m.ID,
		Name: m.Name,
		Slug: m.Slug,
	}
}

func ToWorkoutPlanResponse(wp *workout.WorkoutPlan) WorkoutPlanResponse {
	resp := WorkoutPlanResponse{
		ID:             wp.ID,
		Name:           wp.Name,
		Active:         wp.Active,
		UserID:         wp.UserID,
		CurrentCycleID: wp.CurrentCycleID,
		CreatedAt:      wp.CreatedAt,
		UpdatedAt:      wp.UpdatedAt,
	}
	// if len(wp.WorkoutCycles) > 0 {
	resp.WorkoutCycles = make([]WorkoutCycleResponse, 0, len(wp.WorkoutCycles))
	for _, wc := range wp.WorkoutCycles {
		resp.WorkoutCycles = append(resp.WorkoutCycles, ToWorkoutCycleResponse(wc))
	}
	// }
	return resp
}

func ToWorkoutCycleResponse(wc *workout.WorkoutCycle) WorkoutCycleResponse {
	resp := WorkoutCycleResponse{
		ID:              wc.ID,
		Name:            wc.Name,
		WorkoutPlanID:   wc.WorkoutPlanID,
		WeekNumber:      wc.WeekNumber,
		Completed:       wc.Completed,
		Skipped:         wc.Skipped,
		PreviousCycleID: wc.PreviousCycleID,
		NextCycleID:     wc.NextCycleID,
		CreatedAt:       wc.CreatedAt,
		UpdatedAt:       wc.UpdatedAt,
	}
	if len(wc.Workouts) > 0 {
		resp.Workouts = make([]WorkoutResponse, 0, len(wc.Workouts))
		for _, w := range wc.Workouts {
			resp.Workouts = append(resp.Workouts, ToWorkoutResponse(w))
		}
	}

	return resp
}

func ToWorkoutResponse(w *workout.Workout) WorkoutResponse {
	resp := WorkoutResponse{
		ID:                w.ID,
		Name:              w.Name,
		WorkoutCycleID:    w.WorkoutCycleID,
		Date:              w.Date,
		Index:             w.Index,
		Completed:         w.Completed,
		Skipped:           w.Skipped,
		PreviousWorkoutID: w.PreviousWorkoutID,
		CreatedAt:         w.CreatedAt,
		UpdatedAt:         w.UpdatedAt,
	}
	// if len(w.WorkoutExercises) > 0 {
	resp.WorkoutExercises = make([]WorkoutExerciseResponse, 0, len(w.WorkoutExercises))
	for _, we := range w.WorkoutExercises {
		resp.WorkoutExercises = append(resp.WorkoutExercises, ToWorkoutExerciseResponse(we))
	}
	// }
	return resp
}

func ToWorkoutExerciseResponse(we *workout.WorkoutExercise) WorkoutExerciseResponse {
	var ie *IndividualExerciseResponse
	if we.IndividualExercise != nil {
		tmp := ToIndividualExerciseResponse(we.IndividualExercise)
		ie = &tmp
	}
	resp := WorkoutExerciseResponse{
		ID:                   we.ID,
		WorkoutID:            we.WorkoutID,
		Index:                we.Index,
		IndividualExerciseID: we.IndividualExerciseID,
		IndividualExercise:   ie,
		Completed:            we.Completed,
		Skipped:              we.Skipped,
		SetsQt:               we.SetsQt,
		CreatedAt:            we.CreatedAt,
		UpdatedAt:            we.UpdatedAt,
	}

	// if len(we.WorkoutSets) > 0 {
	resp.WorkoutSets = make([]WorkoutSetResponse, 0, len(we.WorkoutSets))
	for _, s := range we.WorkoutSets {
		resp.WorkoutSets = append(resp.WorkoutSets, ToWorkoutSetResponse(s))
	}
	// }
	return resp
}

func ToWorkoutSetResponse(s *workout.WorkoutSet) WorkoutSetResponse {
	return WorkoutSetResponse{
		ID:                s.ID,
		WorkoutExerciseID: s.WorkoutExerciseID,
		Index:             s.Index,
		Completed:         s.Completed,
		Weight:            s.Weight,
		Reps:              s.Reps,
		Skipped:           s.Skipped,
		PreviousWeight:    s.PreviousWeight,
		PreviousReps:      s.PreviousReps,
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}

func ToIndividualExerciseResponse(e *workout.IndividualExercise) IndividualExerciseResponse {
	resp := IndividualExerciseResponse{
		ID:                             e.ID,
		Name:                           e.Name,
		IsBodyweight:                   e.IsBodyweight,
		IsTimeBased:                    e.IsTimeBased,
		MuscleGroupID:                  e.MuscleGroupID,
		ExerciseID:                     e.ExerciseID,
		LastCompletedWorkoutExerciseID: e.LastCompletedWorkoutExerciseID,
		CurrentWeight:                  e.CurrentWeight,
		CurrentReps:                    e.CurrentReps,
		CreatedAt:                      e.CreatedAt,
		UpdatedAt:                      e.UpdatedAt,
	}

	if e.MuscleGroup != nil {
		resp.MuscleGroup = ToMuscleGroupResponse(e.MuscleGroup)
	}
	if e.Exercise != nil {
		resp.Exercise = ToExerciseResponse(e.Exercise)
	}

	if e.LastCompletedWorkoutExercise != nil {
		resp.LastCompletedWorkoutExercise = ToWorkoutExerciseResponse(e.LastCompletedWorkoutExercise)
	}

	return resp
}

func ToIndividualExerciseStatsResponse(e *workout.IndividualExercise) IndividualExerciseStatsResponse {
	resp := IndividualExerciseStatsResponse{
		ID:            e.ID,
		Name:          e.Name,
		IsBodyweight:  e.IsBodyweight,
		IsTimeBased:   e.IsTimeBased,
		MuscleGroupID: e.MuscleGroupID,
		ExerciseID:    e.ExerciseID,
		CurrentWeight: e.CurrentWeight,
		CurrentReps:   e.CurrentReps,
		CreatedAt:     e.CreatedAt,
		UpdatedAt:     e.UpdatedAt,
	}

	if e.MuscleGroup != nil {
		resp.MuscleGroup = ToMuscleGroupResponse(e.MuscleGroup)
	}
	if e.Exercise != nil {
		resp.Exercise = ToExerciseResponse(e.Exercise)
	}

	return resp
}
