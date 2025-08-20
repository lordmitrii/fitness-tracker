package ai

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func BuildProcessedStats(stats []*workout.IndividualExercise, profile *user.Profile) []map[string]any {
	processedStats := []map[string]any{}

	for _, stat := range stats {
		if stat.CurrentWeight == 0 && stat.CurrentReps == 0 {
			continue
		}
		statMap := map[string]any{
			"exercise_name":   stat.Name,
			"best_set_reps":   stat.CurrentReps,
			"best_set_weight": stat.CurrentWeight,
		}
		if stat.IsTimeBased {
			statMap["is_time_based"] = true
		}
		processedStats = append(processedStats, statMap)
	}

	if profile != nil {
		processedStats = append(processedStats, map[string]any{
			"user_weight": profile.WeightKg,
			"user_height": profile.HeightCm,
			"user_age":    profile.Age,
			"user_sex":    profile.Sex,
		})
	}

	return processedStats
}

func BuildProcessedCycle(cycle *workout.WorkoutCycle) []map[string]any {
	processedCycle := []map[string]any{}

	for _, workout := range cycle.Workouts {
		workoutMap := map[string]any{
			"workout_name": workout.Name,
			// "workout_date": workout.Date,
			"workout_completed": workout.Completed,
		}
		processedExercises := []map[string]any{}

		for _, we := range workout.WorkoutExercises {
			exerciseMap := map[string]any{
				"exercise_name":      we.IndividualExercise.Name,
				"exercise_sets_qty":  len(we.WorkoutSets),
				"exercise_completed": we.Completed,
			}
			processedExercises = append(processedExercises, exerciseMap)
		}

		if len(processedExercises) > 0 {
			workoutMap["exercises"] = processedExercises
		}
		processedCycle = append(processedCycle, workoutMap)
	}

	return processedCycle
}
