package ai_test

import (
	"testing"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/ai"
)

func TestBuildProcessedStats(t *testing.T) {
	stats := []*workout.IndividualExercise{
		{Name: "Squat", CurrentReps: 10, CurrentWeight: 100},
		{Name: "Plank", IsTimeBased: true, CurrentReps: 60},
		{Name: "Empty", CurrentReps: 0, CurrentWeight: 0},
	}
	profile := &user.Profile{WeightKg: 70, HeightCm: 175, Age: 25, Sex: "F"}

	got := ai.BuildProcessedStats(stats, profile)

	if len(got) != 3 {
		t.Fatalf("expected 3 maps, got %d", len(got))
	}

	if got[0]["exercise_name"] != "Squat" {
		t.Errorf("expected Squat, got %v", got[0]["exercise_name"])
	}
	if got[1]["is_time_based"] != true {
		t.Errorf("expected is_time_based=true, got %v", got[1]["is_time_based"])
	}

	profileMap := got[2]
	if profileMap["user_weight"] != profile.WeightKg {
		t.Errorf("expected user_weight=%v, got %v", profile.WeightKg, profileMap["user_weight"])
	}
	if profileMap["user_height"] != profile.HeightCm {
		t.Errorf("expected user_height=%v, got %v", profile.HeightCm, profileMap["user_height"])
	}
	if profileMap["user_age"] != profile.Age {
		t.Errorf("expected user_age=%v, got %v", profile.Age, profileMap["user_age"])
	}
	if profileMap["user_sex"] != profile.Sex {
		t.Errorf("expected user_sex=%v, got %v", profile.Sex, profileMap["user_sex"])
	}
}

func TestBuildProcessedCycle(t *testing.T) {
	cycle := &workout.WorkoutCycle{
		Workouts: []*workout.Workout{
			{
				Name:      "Day 1",
				Completed: true,
				WorkoutExercises: []*workout.WorkoutExercise{
					{
						IndividualExercise: &workout.IndividualExercise{Name: "Bench"},
						WorkoutSets:        []*workout.WorkoutSet{{}, {}},
						Completed:          false,
					},
				},
			},
		},
	}

	got := ai.BuildProcessedCycle(cycle)

	if len(got) != 1 {
		t.Fatalf("expected 1 workout map, got %d", len(got))
	}
	if got[0]["workout_name"] != "Day 1" {
		t.Errorf("expected Day 1, got %v", got[0]["workout_name"])
	}
	exercises := got[0]["exercises"].([]map[string]any)
	if exercises[0]["exercise_name"] != "Bench" {
		t.Errorf("expected Bench exercise, got %v", exercises[0]["exercise_name"])
	}
}
