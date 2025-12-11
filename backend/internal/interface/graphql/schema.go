package graphapi

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	gql "github.com/graphql-go/graphql"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/interface/graphql/dto"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type resolver struct {
	workoutSvc usecase.WorkoutService
}

func buildSchema(workoutSvc usecase.WorkoutService) (gql.Schema, error) {
	r := &resolver{workoutSvc: workoutSvc}

	types := r.defineTypes()

	query := gql.NewObject(gql.ObjectConfig{
		Name: "Query",
		Fields: gql.Fields{
			"workoutPlans": &gql.Field{
				Type: gql.NewNonNull(gql.NewList(types.workoutPlan)),
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					plans, err := r.workoutSvc.GetWorkoutPlansByUserID(p.Context, userID)
					if err != nil {
						return nil, err
					}
					resp := make([]dto.WorkoutPlanResponse, 0, len(plans))
					for _, wp := range plans {
						resp = append(resp, dto.ToWorkoutPlanResponse(wp))
					}
					return resp, nil
				},
			},
			"workoutPlan": &gql.Field{
				Type: types.workoutPlan,
				Args: gql.FieldConfigArgument{
					"id": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					wp, err := r.workoutSvc.GetWorkoutPlanByID(p.Context, userID, planID)
					if err != nil {
						return nil, err
					}
					resp := dto.ToWorkoutPlanResponse(wp)
					return resp, nil
				},
			},
			"workoutCycle": &gql.Field{
				Type: types.workoutCycle,
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					wc, err := r.workoutSvc.GetWorkoutCycleByID(p.Context, userID, planID, cycleID)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutCycleResponse(wc), nil
				},
			},
			"workouts": &gql.Field{
				Type: gql.NewNonNull(gql.NewList(types.workout)),
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					ws, err := r.workoutSvc.GetWorkoutsByWorkoutCycleID(p.Context, userID, planID, cycleID)
					if err != nil {
						return nil, err
					}
					resp := make([]*dto.WorkoutResponse, 0, len(ws))
					for _, w := range ws {
						mapped, err := r.mapWorkout(p.Context, userID, planID, cycleID, w)
						if err != nil {
							return nil, err
						}
						resp = append(resp, mapped)
					}
					return resp, nil
				},
			},
			"workout": &gql.Field{
				Type: types.workout,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					w, err := r.workoutSvc.GetWorkoutByID(p.Context, userID, planID, cycleID, workoutID)
					if err != nil {
						return nil, err
					}
					return r.mapWorkout(p.Context, userID, planID, cycleID, w)
				},
			},
			"individualExercises": &gql.Field{
				Type: gql.NewNonNull(gql.NewList(types.individualExercise)),
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					ies, err := r.workoutSvc.GetIndividualExercisesByUserID(p.Context, userID)
					if err != nil {
						return nil, err
					}
					resp := make([]dto.IndividualExerciseResponse, 0, len(ies))
					for _, ie := range ies {
						resp = append(resp, dto.ToIndividualExerciseResponse(ie))
					}
					return resp, nil
				},
			},
			"currentCycle": &gql.Field{
				Type: types.workoutCycle,
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					cycle, err := r.workoutSvc.GetCurrentWorkoutCycle(p.Context, userID)
					if err != nil {
						return nil, err
					}
					if cycle == nil {
						return nil, nil
					}
					return dto.ToWorkoutCycleResponse(cycle), nil
				},
			},
		},
	})

	mutation := gql.NewObject(gql.ObjectConfig{
		Name: "Mutation",
		Fields: gql.Fields{
			"createWorkoutPlan": &gql.Field{
				Type: types.workoutPlan,
				Args: gql.FieldConfigArgument{
					"input": &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutPlan)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					in, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					wp := &dto.WorkoutPlanCreateRequest{}
					if err := decodeMap(in, wp); err != nil {
						return nil, err
					}
					newPlan := &workout.WorkoutPlan{
						Name:   wp.Name,
						Active: wp.Active,
					}
					created, err := r.workoutSvc.CreateWorkoutPlan(p.Context, userID, newPlan)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutPlanResponse(created), nil
				},
			},
			"updateWorkoutPlan": &gql.Field{
				Type: types.workoutPlan,
				Args: gql.FieldConfigArgument{
					"id":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input": &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutPlanPatch)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					id, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					in, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var patch dto.WorkoutPlanUpdateRequest
					if err := decodeMap(in, &patch); err != nil {
						return nil, err
					}
					updates := dto.BuildUpdatesFromPatchDTO(&patch)
					wp, err := r.workoutSvc.UpdateWorkoutPlan(p.Context, userID, id, updates)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutPlanResponse(wp), nil
				},
			},
			"deleteWorkoutPlan": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"id": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					id, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					if err := r.workoutSvc.DeleteWorkoutPlan(p.Context, userID, id); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"setActiveWorkoutPlan": &gql.Field{
				Type: types.workoutPlan,
				Args: gql.FieldConfigArgument{
					"id":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"active": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					id, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					active, _ := p.Args["active"].(bool)
					wp, err := r.workoutSvc.SetActiveWorkoutPlan(p.Context, userID, id, active)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutPlanResponse(wp), nil
				},
			},
			"createWorkoutCycle": &gql.Field{
				Type: types.workoutCycle,
				Args: gql.FieldConfigArgument{
					"planId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":  &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutCycle)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutCycleCreateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					wc := &workout.WorkoutCycle{
						Name:          in.Name,
						WeekNumber:    in.WeekNumber,
						WorkoutPlanID: planID,
					}
					if err := r.workoutSvc.CreateWorkoutCycle(p.Context, userID, planID, wc); err != nil {
						return nil, err
					}
					return dto.ToWorkoutCycleResponse(wc), nil
				},
			},
			"updateWorkoutCycle": &gql.Field{
				Type: types.workoutCycle,
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":   &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutCyclePatch)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutCycleUpdateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					updates := dto.BuildUpdatesFromPatchDTO(&in)
					wc, err := r.workoutSvc.UpdateWorkoutCycle(p.Context, userID, planID, cycleID, updates)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutCycleResponse(wc), nil
				},
			},
			"completeWorkoutCycle": &gql.Field{
				Type: types.workoutCycle,
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"completed": &gql.ArgumentConfig{
						Type: gql.NewNonNull(gql.Boolean),
					},
					"skipped": &gql.ArgumentConfig{
						Type: gql.NewNonNull(gql.Boolean),
					},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					completed, _ := p.Args["completed"].(bool)
					skipped, _ := p.Args["skipped"].(bool)
					wc, err := r.workoutSvc.CompleteWorkoutCycle(p.Context, userID, planID, cycleID, completed, skipped)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutCycleResponse(wc), nil
				},
			},
			"deleteWorkoutCycle": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					if err := r.workoutSvc.DeleteWorkoutCycle(p.Context, userID, planID, cycleID); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"createWorkout": &gql.Field{
				Type: types.workout,
				Args: gql.FieldConfigArgument{
					"planId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":   &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkout)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutCreateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					w := &workout.Workout{
						Name:  in.Name,
						Date:  in.Date,
						Index: in.Index,
					}
					if err := r.workoutSvc.CreateWorkout(p.Context, userID, planID, cycleID, w); err != nil {
						return nil, err
					}
					return dto.ToWorkoutResponse(w), nil
				},
			},
			"updateWorkout": &gql.Field{
				Type: types.workout,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":     &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutPatch)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutUpdateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					updates := dto.BuildUpdatesFromPatchDTO(&in)
					w, err := r.workoutSvc.UpdateWorkout(p.Context, userID, planID, cycleID, workoutID, updates)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutResponse(w), nil
				},
			},
			"completeWorkout": &gql.Field{
				Type: types.workoutComplete,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"completed": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
					"skipped":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					completed, _ := p.Args["completed"].(bool)
					skipped, _ := p.Args["skipped"].(bool)
					w, kcal, err := r.workoutSvc.CompleteWorkout(p.Context, userID, planID, cycleID, workoutID, completed, skipped)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutCompleteResponse(w, kcal), nil
				},
			},
			"deleteWorkout": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					if err := r.workoutSvc.DeleteWorkout(p.Context, userID, planID, cycleID, workoutID); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"moveWorkout": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"direction": &gql.ArgumentConfig{Type: gql.NewNonNull(types.moveDirection)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					dir, _ := p.Args["direction"].(string)
					if err := r.workoutSvc.MoveWorkout(p.Context, userID, planID, cycleID, workoutID, dir); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"addWorkoutExercise": &gql.Field{
				Type: types.workoutExercise,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":     &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutExercise)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutExerciseCreateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					we := &workout.WorkoutExercise{
						IndividualExerciseID: in.IndividualExerciseID,
						Index:                in.Index,
						SetsQt:               in.SetsQt,
					}
					if err := r.workoutSvc.CreateWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, we); err != nil {
						return nil, err
					}
					return dto.ToWorkoutExerciseResponse(we), nil
				},
			},
			"updateWorkoutExercise": &gql.Field{
				Type: types.workoutExercise,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":        &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":     &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutExercisePatch)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					weID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutExerciseUpdateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					updates := dto.BuildUpdatesFromPatchDTO(&in)
					we, err := r.workoutSvc.UpdateWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, weID, updates)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutExerciseResponse(we), nil
				},
			},
			"completeWorkoutExercise": &gql.Field{
				Type: types.workoutExerciseComplete,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":        &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"completed": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
					"skipped":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					weID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					completed, _ := p.Args["completed"].(bool)
					skipped, _ := p.Args["skipped"].(bool)
					we, kcal, err := r.workoutSvc.CompleteWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, weID, completed, skipped)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutExerciseCompleteResponse(we, kcal), nil
				},
			},
			"deleteWorkoutExercise": &gql.Field{
				Type: types.workoutExerciseDelete,
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":        &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					weID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					kcal, err := r.workoutSvc.DeleteWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, weID)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutExerciseDeleteResponse(kcal), nil
				},
			},
			"moveWorkoutExercise": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"planId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":        &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"direction": &gql.ArgumentConfig{Type: gql.NewNonNull(types.moveDirection)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					weID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					dir, _ := p.Args["direction"].(string)
					if err := r.workoutSvc.MoveWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, weID, dir); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"replaceWorkoutExercise": &gql.Field{
				Type: types.workoutExercise,
				Args: gql.FieldConfigArgument{
					"planId":               &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":              &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":            &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":                   &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"individualExerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"setsQt":               &gql.ArgumentConfig{Type: gql.Int},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					weID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					indID, err := toUintArg(p.Args["individualExerciseId"])
					if err != nil {
						return nil, err
					}
					setsQt := int64(0)
					if v, ok := p.Args["setsQt"].(int); ok {
						setsQt = int64(v)
					}
					we, err := r.workoutSvc.ReplaceWorkoutExercise(p.Context, userID, planID, cycleID, workoutID, weID, indID, setsQt)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutExerciseResponse(we), nil
				},
			},
			"addWorkoutSet": &gql.Field{
				Type: types.workoutSet,
				Args: gql.FieldConfigArgument{
					"planId":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"exerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":      &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutSet)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					exID, err := toUintArg(p.Args["exerciseId"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutSetCreateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					ws := &workout.WorkoutSet{
						Index:          in.Index,
						Weight:         in.Weight,
						Reps:           in.Reps,
						PreviousWeight: in.PreviousWeight,
						PreviousReps:   in.PreviousReps,
					}
					if err := r.workoutSvc.CreateWorkoutSet(p.Context, userID, planID, cycleID, workoutID, exID, ws); err != nil {
						return nil, err
					}
					return dto.ToWorkoutSetResponse(ws), nil
				},
			},
			"updateWorkoutSet": &gql.Field{
				Type: types.workoutSet,
				Args: gql.FieldConfigArgument{
					"planId":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"exerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":         &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"input":      &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputWorkoutSetPatch)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					exID, err := toUintArg(p.Args["exerciseId"])
					if err != nil {
						return nil, err
					}
					setID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.WorkoutSetUpdateRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					updates := dto.BuildUpdatesFromPatchDTO(&in)
					ws, err := r.workoutSvc.UpdateWorkoutSet(p.Context, userID, planID, cycleID, workoutID, exID, setID, updates)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutSetResponse(ws), nil
				},
			},
			"completeWorkoutSet": &gql.Field{
				Type: types.workoutSetComplete,
				Args: gql.FieldConfigArgument{
					"planId":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"exerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":         &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"completed":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
					"skipped":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.Boolean)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					exID, err := toUintArg(p.Args["exerciseId"])
					if err != nil {
						return nil, err
					}
					setID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					completed, _ := p.Args["completed"].(bool)
					skipped, _ := p.Args["skipped"].(bool)
					ws, kcal, err := r.workoutSvc.CompleteWorkoutSet(p.Context, userID, planID, cycleID, workoutID, exID, setID, completed, skipped)
					if err != nil {
						return nil, err
					}
					return dto.ToWorkoutSetCompleteResponse(ws, kcal), nil
				},
			},
			"deleteWorkoutSet": &gql.Field{
				Type: types.workoutSetDelete,
				Args: gql.FieldConfigArgument{
					"planId":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"exerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":         &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					exID, err := toUintArg(p.Args["exerciseId"])
					if err != nil {
						return nil, err
					}
					setID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					kcal, err := r.workoutSvc.DeleteWorkoutSet(p.Context, userID, planID, cycleID, workoutID, exID, setID)
					if err != nil {
						return nil, err
					}
					return dto.ToSetDeleteResponse(kcal), nil
				},
			},
			"moveWorkoutSet": &gql.Field{
				Type: gql.NewNonNull(gql.Boolean),
				Args: gql.FieldConfigArgument{
					"planId":     &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"cycleId":    &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"workoutId":  &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"exerciseId": &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"id":         &gql.ArgumentConfig{Type: gql.NewNonNull(gql.ID)},
					"direction":  &gql.ArgumentConfig{Type: gql.NewNonNull(types.moveDirection)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					planID, err := toUintArg(p.Args["planId"])
					if err != nil {
						return nil, err
					}
					cycleID, err := toUintArg(p.Args["cycleId"])
					if err != nil {
						return nil, err
					}
					workoutID, err := toUintArg(p.Args["workoutId"])
					if err != nil {
						return nil, err
					}
					exID, err := toUintArg(p.Args["exerciseId"])
					if err != nil {
						return nil, err
					}
					setID, err := toUintArg(p.Args["id"])
					if err != nil {
						return nil, err
					}
					dir, _ := p.Args["direction"].(string)
					if err := r.workoutSvc.MoveWorkoutSet(p.Context, userID, planID, cycleID, workoutID, exID, setID, dir); err != nil {
						return nil, err
					}
					return true, nil
				},
			},
			"upsertIndividualExercise": &gql.Field{
				Type: types.individualExercise,
				Args: gql.FieldConfigArgument{
					"input": &gql.ArgumentConfig{Type: gql.NewNonNull(types.inputIndividualExercise)},
				},
				Resolve: func(p gql.ResolveParams) (any, error) {
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					inputMap, err := inputAsMap(p.Args, "input")
					if err != nil {
						return nil, err
					}
					var in dto.IndividualExerciseCreateOrGetRequest
					if err := decodeMap(inputMap, &in); err != nil {
						return nil, err
					}
					ie := &workout.IndividualExercise{
						Name:          in.Name,
						IsBodyweight:  in.IsBodyweight,
						IsTimeBased:   in.IsTimeBased,
						MuscleGroupID: in.MuscleGroupID,
						ExerciseID:    in.ExerciseID,
					}
					res, err := r.workoutSvc.GetOrCreateIndividualExercise(p.Context, userID, ie)
					if err != nil {
						return nil, err
					}
					return dto.ToIndividualExerciseResponse(res), nil
				},
			},
		},
	})

	return gql.NewSchema(gql.SchemaConfig{
		Query:    query,
		Mutation: mutation,
	})
}

// typeBundle keeps references to avoid cyclic init order issues.
type typeBundle struct {
	workoutPlan             *gql.Object
	workoutCycle            *gql.Object
	workout                 *gql.Object
	workoutExercise         *gql.Object
	workoutExerciseComplete *gql.Object
	workoutExerciseDelete   *gql.Object
	workoutSet              *gql.Object
	workoutSetComplete      *gql.Object
	workoutSetDelete        *gql.Object
	workoutComplete         *gql.Object
	individualExercise      *gql.Object
	exercise                *gql.Object
	muscleGroup             *gql.Object

	inputWorkoutPlan          *gql.InputObject
	inputWorkoutPlanPatch     *gql.InputObject
	inputWorkoutCycle         *gql.InputObject
	inputWorkoutCyclePatch    *gql.InputObject
	inputWorkout              *gql.InputObject
	inputWorkoutPatch         *gql.InputObject
	inputWorkoutExercise      *gql.InputObject
	inputWorkoutExercisePatch *gql.InputObject
	inputWorkoutSet           *gql.InputObject
	inputWorkoutSetPatch      *gql.InputObject
	inputIndividualExercise   *gql.InputObject

	moveDirection *gql.Enum
}

func (r *resolver) defineTypes() typeBundle {
	bundle := typeBundle{}

	bundle.moveDirection = gql.NewEnum(gql.EnumConfig{
		Name: "MoveDirection",
		Values: gql.EnumValueConfigMap{
			"up":   &gql.EnumValueConfig{Value: "up"},
			"down": &gql.EnumValueConfig{Value: "down"},
		},
	})

	bundle.muscleGroup = gql.NewObject(gql.ObjectConfig{
		Name: "MuscleGroup",
		Fields: gql.Fields{
			"id":   simpleField[dto.MuscleGroupResponse](gql.NewNonNull(gql.ID), func(mg *dto.MuscleGroupResponse) any { return mg.ID }),
			"name": simpleField[dto.MuscleGroupResponse](gql.String, func(mg *dto.MuscleGroupResponse) any { return mg.Name }),
			"slug": simpleField[dto.MuscleGroupResponse](gql.String, func(mg *dto.MuscleGroupResponse) any { return mg.Slug }),
		},
	})

	bundle.exercise = gql.NewObject(gql.ObjectConfig{
		Name: "Exercise",
		Fields: gql.Fields{
			"id":            simpleField[dto.ExerciseResponse](gql.NewNonNull(gql.ID), func(e *dto.ExerciseResponse) any { return e.ID }),
			"name":          simpleField[dto.ExerciseResponse](gql.String, func(e *dto.ExerciseResponse) any { return e.Name }),
			"slug":          simpleField[dto.ExerciseResponse](gql.String, func(e *dto.ExerciseResponse) any { return e.Slug }),
			"isBodyweight":  simpleField[dto.ExerciseResponse](gql.Boolean, func(e *dto.ExerciseResponse) any { return e.IsBodyweight }),
			"isTimeBased":   simpleField[dto.ExerciseResponse](gql.Boolean, func(e *dto.ExerciseResponse) any { return e.IsTimeBased }),
			"muscleGroupId": simpleField[dto.ExerciseResponse](gql.ID, func(e *dto.ExerciseResponse) any { return e.MuscleGroupID }),
			"muscleGroup": &gql.Field{
				Type: bundle.muscleGroup,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.ExerciseResponse](p, func(e *dto.ExerciseResponse) any { return e.MuscleGroup })
				},
			},
		},
	})

	bundle.individualExercise = gql.NewObject(gql.ObjectConfig{
		Name: "IndividualExercise",
		Fields: gql.Fields{
			"id":                             simpleField[dto.IndividualExerciseResponse](gql.NewNonNull(gql.ID), func(e *dto.IndividualExerciseResponse) any { return e.ID }),
			"name":                           simpleField[dto.IndividualExerciseResponse](gql.String, func(e *dto.IndividualExerciseResponse) any { return e.Name }),
			"isBodyweight":                   simpleField[dto.IndividualExerciseResponse](gql.Boolean, func(e *dto.IndividualExerciseResponse) any { return e.IsBodyweight }),
			"isTimeBased":                    simpleField[dto.IndividualExerciseResponse](gql.Boolean, func(e *dto.IndividualExerciseResponse) any { return e.IsTimeBased }),
			"muscleGroupId":                  simpleField[dto.IndividualExerciseResponse](gql.ID, func(e *dto.IndividualExerciseResponse) any { return e.MuscleGroupID }),
			"exerciseId":                     simpleField[dto.IndividualExerciseResponse](gql.ID, func(e *dto.IndividualExerciseResponse) any { return e.ExerciseID }),
			"lastCompletedWorkoutExerciseId": simpleField[dto.IndividualExerciseResponse](gql.ID, func(e *dto.IndividualExerciseResponse) any { return e.LastCompletedWorkoutExerciseID }),
			"currentWeight":                  simpleField[dto.IndividualExerciseResponse](gql.Int, func(e *dto.IndividualExerciseResponse) any { return e.CurrentWeight }),
			"currentReps":                    simpleField[dto.IndividualExerciseResponse](gql.Int, func(e *dto.IndividualExerciseResponse) any { return e.CurrentReps }),
			"muscleGroup": &gql.Field{
				Type: bundle.muscleGroup,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.IndividualExerciseResponse](p, func(e *dto.IndividualExerciseResponse) any { return e.MuscleGroup })
				},
			},
			"exercise": &gql.Field{
				Type: bundle.exercise,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.IndividualExerciseResponse](p, func(e *dto.IndividualExerciseResponse) any { return e.Exercise })
				},
			},
			"createdAt": timeFieldFrom[dto.IndividualExerciseResponse](func(e *dto.IndividualExerciseResponse) *time.Time { return e.CreatedAt }),
			"updatedAt": timeFieldFrom[dto.IndividualExerciseResponse](func(e *dto.IndividualExerciseResponse) *time.Time { return e.UpdatedAt }),
		},
	})

	bundle.workoutSet = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutSet",
		Fields: gql.Fields{
			"id":                simpleField[dto.WorkoutSetResponse](gql.NewNonNull(gql.ID), func(s *dto.WorkoutSetResponse) any { return s.ID }),
			"workoutExerciseId": simpleField[dto.WorkoutSetResponse](gql.NewNonNull(gql.ID), func(s *dto.WorkoutSetResponse) any { return s.WorkoutExerciseID }),
			"index":             simpleField[dto.WorkoutSetResponse](gql.Int, func(s *dto.WorkoutSetResponse) any { return s.Index }),
			"weight":            simpleField[dto.WorkoutSetResponse](gql.Int, func(s *dto.WorkoutSetResponse) any { return s.Weight }),
			"reps":              simpleField[dto.WorkoutSetResponse](gql.Int, func(s *dto.WorkoutSetResponse) any { return s.Reps }),
			"previousWeight":    simpleField[dto.WorkoutSetResponse](gql.Int, func(s *dto.WorkoutSetResponse) any { return s.PreviousWeight }),
			"previousReps":      simpleField[dto.WorkoutSetResponse](gql.Int, func(s *dto.WorkoutSetResponse) any { return s.PreviousReps }),
			"completed":         simpleField[dto.WorkoutSetResponse](gql.Boolean, func(s *dto.WorkoutSetResponse) any { return s.Completed }),
			"skipped":           simpleField[dto.WorkoutSetResponse](gql.Boolean, func(s *dto.WorkoutSetResponse) any { return s.Skipped }),
			"createdAt":         timeFieldFrom[dto.WorkoutSetResponse](func(s *dto.WorkoutSetResponse) *time.Time { return s.CreatedAt }),
			"updatedAt":         timeFieldFrom[dto.WorkoutSetResponse](func(s *dto.WorkoutSetResponse) *time.Time { return s.UpdatedAt }),
		},
	})

	bundle.workoutExercise = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutExercise",
		Fields: gql.FieldsThunk(func() gql.Fields {
			return gql.Fields{
				"id":                   simpleField[dto.WorkoutExerciseResponse](gql.NewNonNull(gql.ID), func(we *dto.WorkoutExerciseResponse) any { return we.ID }),
				"workoutId":            simpleField[dto.WorkoutExerciseResponse](gql.NewNonNull(gql.ID), func(we *dto.WorkoutExerciseResponse) any { return we.WorkoutID }),
				"index":                simpleField[dto.WorkoutExerciseResponse](gql.Int, func(we *dto.WorkoutExerciseResponse) any { return we.Index }),
				"individualExerciseId": simpleField[dto.WorkoutExerciseResponse](gql.ID, func(we *dto.WorkoutExerciseResponse) any { return we.IndividualExerciseID }),
				"individualExercise": &gql.Field{
					Type: bundle.individualExercise,
					Resolve: func(p gql.ResolveParams) (any, error) {
						return resolveFromSource[dto.WorkoutExerciseResponse](p, func(we *dto.WorkoutExerciseResponse) any { return we.IndividualExercise })
					},
				},
				"workoutSets": &gql.Field{
					Type: gql.NewList(bundle.workoutSet),
					Resolve: func(p gql.ResolveParams) (any, error) {
						return resolveFromSource[dto.WorkoutExerciseResponse](p, func(we *dto.WorkoutExerciseResponse) any { return we.WorkoutSets })
					},
				},
				"previousExerciseId": simpleField[dto.WorkoutExerciseResponse](gql.ID, func(we *dto.WorkoutExerciseResponse) any { return we.PreviousExerciseID }),
				"completed":          simpleField[dto.WorkoutExerciseResponse](gql.Boolean, func(we *dto.WorkoutExerciseResponse) any { return we.Completed }),
				"skipped":            simpleField[dto.WorkoutExerciseResponse](gql.Boolean, func(we *dto.WorkoutExerciseResponse) any { return we.Skipped }),
				"setsQt":             simpleField[dto.WorkoutExerciseResponse](gql.Int, func(we *dto.WorkoutExerciseResponse) any { return we.SetsQt }),
				"createdAt":          timeFieldFrom[dto.WorkoutExerciseResponse](func(we *dto.WorkoutExerciseResponse) *time.Time { return we.CreatedAt }),
				"updatedAt":          timeFieldFrom[dto.WorkoutExerciseResponse](func(we *dto.WorkoutExerciseResponse) *time.Time { return we.UpdatedAt }),
			}
		}),
	})

	bundle.workout = gql.NewObject(gql.ObjectConfig{
		Name: "Workout",
		Fields: gql.Fields{
			"id":                simpleField[dto.WorkoutResponse](gql.NewNonNull(gql.ID), func(w *dto.WorkoutResponse) any { return w.ID }),
			"name":              simpleField[dto.WorkoutResponse](gql.String, func(w *dto.WorkoutResponse) any { return w.Name }),
			"workoutCycleId":    simpleField[dto.WorkoutResponse](gql.NewNonNull(gql.ID), func(w *dto.WorkoutResponse) any { return w.WorkoutCycleID }),
			"date":              timeFieldFrom[dto.WorkoutResponse](func(w *dto.WorkoutResponse) *time.Time { return w.Date }),
			"index":             simpleField[dto.WorkoutResponse](gql.Int, func(w *dto.WorkoutResponse) any { return w.Index }),
			"completed":         simpleField[dto.WorkoutResponse](gql.Boolean, func(w *dto.WorkoutResponse) any { return w.Completed }),
			"skipped":           simpleField[dto.WorkoutResponse](gql.Boolean, func(w *dto.WorkoutResponse) any { return w.Skipped }),
			"previousWorkoutId": simpleField[dto.WorkoutResponse](gql.ID, func(w *dto.WorkoutResponse) any { return w.PreviousWorkoutID }),
			"workoutExercises": &gql.Field{
				Type: gql.NewList(bundle.workoutExercise),
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.WorkoutResponse](p, func(w *dto.WorkoutResponse) any { return w.WorkoutExercises })
				},
			},
			"estimatedCalories":  simpleField[dto.WorkoutResponse](gql.Float, func(w *dto.WorkoutResponse) any { return w.EstimatedCalories }),
			"estimatedActiveMin": simpleField[dto.WorkoutResponse](gql.Float, func(w *dto.WorkoutResponse) any { return w.EstimatedActiveMin }),
			"estimatedRestMin":   simpleField[dto.WorkoutResponse](gql.Float, func(w *dto.WorkoutResponse) any { return w.EstimatedRestMin }),
			"createdAt":          timeFieldFrom[dto.WorkoutResponse](func(w *dto.WorkoutResponse) *time.Time { return w.CreatedAt }),
			"updatedAt":          timeFieldFrom[dto.WorkoutResponse](func(w *dto.WorkoutResponse) *time.Time { return w.UpdatedAt }),
		},
	})

	bundle.workoutCycle = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutCycle",
		Fields: gql.Fields{
			"id":            simpleField[dto.WorkoutCycleResponse](gql.NewNonNull(gql.ID), func(wc *dto.WorkoutCycleResponse) any { return wc.ID }),
			"name":          simpleField[dto.WorkoutCycleResponse](gql.String, func(wc *dto.WorkoutCycleResponse) any { return wc.Name }),
			"workoutPlanId": simpleField[dto.WorkoutCycleResponse](gql.NewNonNull(gql.ID), func(wc *dto.WorkoutCycleResponse) any { return wc.WorkoutPlanID }),
			"weekNumber":    simpleField[dto.WorkoutCycleResponse](gql.Int, func(wc *dto.WorkoutCycleResponse) any { return wc.WeekNumber }),
			"workouts": &gql.Field{
				Type: gql.NewList(bundle.workout),
				Resolve: func(p gql.ResolveParams) (any, error) {
					var wc *dto.WorkoutCycleResponse
					switch v := p.Source.(type) {
					case *dto.WorkoutCycleResponse:
						wc = v
					case dto.WorkoutCycleResponse:
						tmp := v
						wc = &tmp
					default:
						return nil, nil
					}
					if len(wc.Workouts) > 0 {
						return wc.Workouts, nil
					}
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					ws, err := r.workoutSvc.GetWorkoutsByWorkoutCycleID(p.Context, userID, wc.WorkoutPlanID, wc.ID)
					if err != nil {
						return nil, err
					}
					resp := make([]*dto.WorkoutResponse, 0, len(ws))
					for _, w := range ws {
						mapped, err := r.mapWorkout(p.Context, userID, wc.WorkoutPlanID, wc.ID, w)
						if err != nil {
							return nil, err
						}
						resp = append(resp, mapped)
					}
					return resp, nil
				},
			},
			"completed":       simpleField[dto.WorkoutCycleResponse](gql.Boolean, func(wc *dto.WorkoutCycleResponse) any { return wc.Completed }),
			"skipped":         simpleField[dto.WorkoutCycleResponse](gql.Boolean, func(wc *dto.WorkoutCycleResponse) any { return wc.Skipped }),
			"previousCycleId": simpleField[dto.WorkoutCycleResponse](gql.ID, func(wc *dto.WorkoutCycleResponse) any { return wc.PreviousCycleID }),
			"nextCycleId":     simpleField[dto.WorkoutCycleResponse](gql.ID, func(wc *dto.WorkoutCycleResponse) any { return wc.NextCycleID }),
			"createdAt":       timeFieldFrom[dto.WorkoutCycleResponse](func(wc *dto.WorkoutCycleResponse) *time.Time { return wc.CreatedAt }),
			"updatedAt":       timeFieldFrom[dto.WorkoutCycleResponse](func(wc *dto.WorkoutCycleResponse) *time.Time { return wc.UpdatedAt }),
		},
	})

	bundle.workoutPlan = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutPlan",
		Fields: gql.Fields{
			"id":             simpleField[dto.WorkoutPlanResponse](gql.NewNonNull(gql.ID), func(wp *dto.WorkoutPlanResponse) any { return wp.ID }),
			"name":           simpleField[dto.WorkoutPlanResponse](gql.String, func(wp *dto.WorkoutPlanResponse) any { return wp.Name }),
			"active":         simpleField[dto.WorkoutPlanResponse](gql.Boolean, func(wp *dto.WorkoutPlanResponse) any { return wp.Active }),
			"userId":         simpleField[dto.WorkoutPlanResponse](gql.NewNonNull(gql.ID), func(wp *dto.WorkoutPlanResponse) any { return wp.UserID }),
			"currentCycleId": simpleField[dto.WorkoutPlanResponse](gql.ID, func(wp *dto.WorkoutPlanResponse) any { return wp.CurrentCycleID }),
			"workoutCycles": &gql.Field{
				Type: gql.NewList(bundle.workoutCycle),
				Resolve: func(p gql.ResolveParams) (any, error) {
					var wp *dto.WorkoutPlanResponse
					switch v := p.Source.(type) {
					case *dto.WorkoutPlanResponse:
						wp = v
					case dto.WorkoutPlanResponse:
						tmp := v
						wp = &tmp
					default:
						return nil, nil
					}
					if len(wp.WorkoutCycles) > 0 {
						return wp.WorkoutCycles, nil
					}
					userID, ok := UserIDFromCtx(p.Context)
					if !ok {
						return nil, fmt.Errorf("unauthorized")
					}
					cycles, err := r.workoutSvc.GetWorkoutCyclesByWorkoutPlanID(p.Context, userID, wp.ID)
					if err != nil {
						return nil, err
					}
					resp := make([]dto.WorkoutCycleResponse, 0, len(cycles))
					for _, c := range cycles {
						resp = append(resp, dto.ToWorkoutCycleResponse(c))
					}
					return resp, nil
				},
			},
			"createdAt": timeFieldFrom[dto.WorkoutPlanResponse](func(wp *dto.WorkoutPlanResponse) *time.Time { return wp.CreatedAt }),
			"updatedAt": timeFieldFrom[dto.WorkoutPlanResponse](func(wp *dto.WorkoutPlanResponse) *time.Time { return wp.UpdatedAt }),
		},
	})

	bundle.workoutComplete = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutCompleteResult",
		Fields: gql.Fields{
			"workout": &gql.Field{
				Type: bundle.workout,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.WorkoutCompleteResponse](p, func(r *dto.WorkoutCompleteResponse) any { return r.Workout })
				},
			},
			"estimatedCalories": simpleField[dto.WorkoutCompleteResponse](gql.Float, func(r *dto.WorkoutCompleteResponse) any { return r.EstimatedCalories }),
		},
	})

	bundle.workoutExerciseComplete = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutExerciseCompleteResult",
		Fields: gql.Fields{
			"workoutExercise": &gql.Field{
				Type: bundle.workoutExercise,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.WorkoutExerciseCompleteResponse](p, func(r *dto.WorkoutExerciseCompleteResponse) any { return r.WorkoutExercise })
				},
			},
			"estimatedCalories": simpleField[dto.WorkoutExerciseCompleteResponse](gql.Float, func(r *dto.WorkoutExerciseCompleteResponse) any { return r.EstimatedCalories }),
		},
	})

	bundle.workoutSetComplete = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutSetCompleteResult",
		Fields: gql.Fields{
			"workoutSet": &gql.Field{
				Type: bundle.workoutSet,
				Resolve: func(p gql.ResolveParams) (any, error) {
					return resolveFromSource[dto.WorkoutSetCompleteResponse](p, func(r *dto.WorkoutSetCompleteResponse) any { return r.WorkoutSet })
				},
			},
			"estimatedCalories": simpleField[dto.WorkoutSetCompleteResponse](gql.Float, func(r *dto.WorkoutSetCompleteResponse) any { return r.EstimatedCalories }),
		},
	})

	bundle.workoutExerciseDelete = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutExerciseDeleteResult",
		Fields: gql.Fields{
			"estimatedCalories": simpleField[dto.WorkoutExerciseDeleteResponse](gql.Float, func(r *dto.WorkoutExerciseDeleteResponse) any { return r.EstimatedCalories }),
		},
	})

	bundle.workoutSetDelete = gql.NewObject(gql.ObjectConfig{
		Name: "WorkoutSetDeleteResult",
		Fields: gql.Fields{
			"estimatedCalories": simpleField[dto.SetDeleteResponse](gql.Float, func(r *dto.SetDeleteResponse) any { return r.EstimatedCalories }),
		},
	})

	// Inputs
	bundle.inputWorkoutPlan = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutPlanInput",
		Fields: gql.InputObjectConfigFieldMap{
			"name":   &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.String)},
			"active": &gql.InputObjectFieldConfig{Type: gql.Boolean},
		},
	})
	bundle.inputWorkoutPlanPatch = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutPlanPatch",
		Fields: gql.InputObjectConfigFieldMap{
			"name":           &gql.InputObjectFieldConfig{Type: gql.String},
			"active":         &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"currentCycleId": &gql.InputObjectFieldConfig{Type: gql.ID},
		},
	})
	bundle.inputWorkoutCycle = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutCycleInput",
		Fields: gql.InputObjectConfigFieldMap{
			"name":       &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.String)},
			"weekNumber": &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.Int)},
		},
	})
	bundle.inputWorkoutCyclePatch = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutCyclePatch",
		Fields: gql.InputObjectConfigFieldMap{
			"name":       &gql.InputObjectFieldConfig{Type: gql.String},
			"weekNumber": &gql.InputObjectFieldConfig{Type: gql.Int},
			"completed":  &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"skipped":    &gql.InputObjectFieldConfig{Type: gql.Boolean},
		},
	})
	bundle.inputWorkout = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutInput",
		Fields: gql.InputObjectConfigFieldMap{
			"name":  &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.String)},
			"date":  &gql.InputObjectFieldConfig{Type: gql.String},
			"index": &gql.InputObjectFieldConfig{Type: gql.Int},
		},
	})
	bundle.inputWorkoutPatch = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutPatch",
		Fields: gql.InputObjectConfigFieldMap{
			"name":      &gql.InputObjectFieldConfig{Type: gql.String},
			"date":      &gql.InputObjectFieldConfig{Type: gql.String},
			"index":     &gql.InputObjectFieldConfig{Type: gql.Int},
			"completed": &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"skipped":   &gql.InputObjectFieldConfig{Type: gql.Boolean},
		},
	})
	bundle.inputWorkoutExercise = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutExerciseInput",
		Fields: gql.InputObjectConfigFieldMap{
			"individualExerciseId": &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.ID)},
			"index":                &gql.InputObjectFieldConfig{Type: gql.Int},
			"setsQt":               &gql.InputObjectFieldConfig{Type: gql.Int},
		},
	})
	bundle.inputWorkoutExercisePatch = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutExercisePatch",
		Fields: gql.InputObjectConfigFieldMap{
			"index":     &gql.InputObjectFieldConfig{Type: gql.Int},
			"completed": &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"skipped":   &gql.InputObjectFieldConfig{Type: gql.Boolean},
		},
	})
	bundle.inputWorkoutSet = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutSetInput",
		Fields: gql.InputObjectConfigFieldMap{
			"index":          &gql.InputObjectFieldConfig{Type: gql.Int},
			"weight":         &gql.InputObjectFieldConfig{Type: gql.Int},
			"reps":           &gql.InputObjectFieldConfig{Type: gql.Int},
			"previousWeight": &gql.InputObjectFieldConfig{Type: gql.Int},
			"previousReps":   &gql.InputObjectFieldConfig{Type: gql.Int},
		},
	})
	bundle.inputWorkoutSetPatch = gql.NewInputObject(gql.InputObjectConfig{
		Name: "WorkoutSetPatch",
		Fields: gql.InputObjectConfigFieldMap{
			"index":     &gql.InputObjectFieldConfig{Type: gql.Int},
			"weight":    &gql.InputObjectFieldConfig{Type: gql.Int},
			"reps":      &gql.InputObjectFieldConfig{Type: gql.Int},
			"completed": &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"skipped":   &gql.InputObjectFieldConfig{Type: gql.Boolean},
		},
	})
	bundle.inputIndividualExercise = gql.NewInputObject(gql.InputObjectConfig{
		Name: "IndividualExerciseInput",
		Fields: gql.InputObjectConfigFieldMap{
			"name":          &gql.InputObjectFieldConfig{Type: gql.NewNonNull(gql.String)},
			"isBodyweight":  &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"isTimeBased":   &gql.InputObjectFieldConfig{Type: gql.Boolean},
			"muscleGroupId": &gql.InputObjectFieldConfig{Type: gql.ID},
			"exerciseId":    &gql.InputObjectFieldConfig{Type: gql.ID},
		},
	})

	return bundle
}

func simpleField[T any](typ gql.Output, getter func(*T) any) *gql.Field {
	return &gql.Field{
		Type: typ,
		Resolve: func(p gql.ResolveParams) (any, error) {
			return resolveFromSource[T](p, getter)
		},
	}
}

func timeToString(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

func resolveFromSource[T any](p gql.ResolveParams, getter func(*T) any) (any, error) {
	switch src := p.Source.(type) {
	case *T:
		return getter(src), nil
	case T:
		tmp := src
		return getter(&tmp), nil
	default:
		return nil, nil
	}
}

func (r *resolver) mapWorkout(ctx context.Context, userID, planID, cycleID uint, w *workout.Workout) (*dto.WorkoutResponse, error) {
	if w == nil {
		return nil, nil
	}
	exercises, err := r.workoutSvc.GetWorkoutExercisesByWorkoutID(ctx, userID, planID, cycleID, w.ID)
	if err != nil {
		return nil, err
	}
	for _, we := range exercises {
		sets, err := r.workoutSvc.GetWorkoutSetsByWorkoutExerciseID(ctx, userID, planID, cycleID, w.ID, we.ID)
		if err != nil {
			return nil, err
		}
		we.WorkoutSets = sets
	}
	w.WorkoutExercises = exercises
	resp := dto.ToWorkoutResponse(w)
	return &resp, nil
}

func toUintArg(v any) (uint, error) {
	switch val := v.(type) {
	case nil:
		return 0, fmt.Errorf("missing required id")
	case string:
		num, err := strconv.ParseUint(val, 10, 64)
		if err != nil {
			return 0, err
		}
		return uint(num), nil
	case int:
		return uint(val), nil
	case int64:
		return uint(val), nil
	case float64:
		return uint(val), nil
	case uint:
		return val, nil
	default:
		return 0, fmt.Errorf("invalid id type %T", v)
	}
}

// decodeMap converts a GraphQL input map into a struct via JSON marshalling.
func decodeMap(in map[string]any, out any) error {
	raw, err := json.Marshal(in)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, out)
}

func inputAsMap(args map[string]any, key string) (map[string]any, error) {
	raw, ok := args[key]
	if !ok {
		return nil, fmt.Errorf("%s is required", key)
	}
	m, ok := raw.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", key)
	}
	return m, nil
}

func timeFieldFrom[T any](getter func(*T) *time.Time) *gql.Field {
	return &gql.Field{
		Type: gql.String,
		Resolve: func(p gql.ResolveParams) (any, error) {
			return resolveFromSource[T](p, func(v *T) any {
				return timeToString(getter(v))
			})
		},
	}
}
