package ai

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"math"
)

func BuildProcessedStats(stats []*workout.IndividualExercise, profile *user.Profile, unitSystem string) []map[string]any {
	processedStats := []map[string]any{}
	imperial := unitSystem == "imperial"

	for _, stat := range stats {
		if stat.CurrentWeight == 0 && stat.CurrentReps == 0 {
			continue
		}

		var weight float64
		if imperial {
			weight = math.Round((float64(stat.CurrentWeight)/453.59237)*100) / 100
		} else {
			weight = math.Round((float64(stat.CurrentWeight)/1000)*100) / 100
		}

		statMap := map[string]any{
			"exercise_name":   stat.Name,
			"best_set_reps":   stat.CurrentReps,
			"best_set_weight": weight,
		}
		if stat.IsTimeBased {
			statMap["is_time_based"] = true
		}
		processedStats = append(processedStats, statMap)
	}

	if profile != nil {
		var weight float64
		if imperial {
			weight = math.Round((float64(profile.Weight)/453.59237)*100) / 100
		} else {
			weight = math.Round((float64(profile.Weight)/1000)*100) / 100
		}

		var height float64
		if imperial {
			height = math.Round((float64(profile.Height)/304.8)*100) / 100
		} else {
			height = math.Round((float64(profile.Height)/10)*100) / 100
		}

		processedStats = append(processedStats, map[string]any{
			"user_weight": weight,
			"user_height": height,
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
