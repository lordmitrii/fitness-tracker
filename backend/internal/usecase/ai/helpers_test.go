package ai_test

import (
	"math"
	"testing"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/usecase/ai"
)

func TestBuildProcessedStats_Metric(t *testing.T) {
	stats := []*workout.IndividualExercise{
		{Name: "SkipMe", CurrentReps: 0, CurrentWeight: 0},
		{Name: "TinyDown", CurrentReps: 1, CurrentWeight: 4},
		{Name: "TinyUp", CurrentReps: 1, CurrentWeight: 5},
		{Name: "ExactInt", CurrentReps: 12, CurrentWeight: 2000},
		{Name: "TwoDp", CurrentReps: 8, CurrentWeight: 1234},
		{Name: "Time", IsTimeBased: true, CurrentReps: 30, CurrentWeight: 0},
	}
	profile := &user.Profile{Weight: 70000, Height: 1750, Age: 25, Sex: "F"}

	got := ai.BuildProcessedStats(stats, profile, "metric")
	if len(got) != 6 {
		t.Fatalf("len=%d", len(got))
	}

	if got[0]["exercise_name"] != "TinyDown" {
		t.Fatalf("got[0]=%v", got[0]["exercise_name"])
	}
	if got[1]["exercise_name"] != "TinyUp" {
		t.Fatalf("got[1]=%v", got[1]["exercise_name"])
	}
	if got[2]["exercise_name"] != "ExactInt" {
		t.Fatalf("got[2]=%v", got[2]["exercise_name"])
	}
	if got[3]["exercise_name"] != "TwoDp" {
		t.Fatalf("got[3]=%v", got[3]["exercise_name"])
	}
	if got[4]["exercise_name"] != "Time" {
		t.Fatalf("got[4]=%v", got[4]["exercise_name"])
	}

	if got[0]["best_set_weight"].(float64) != 0.00 {
		t.Errorf("TinyDown=%v", got[0]["best_set_weight"])
	}
	if got[1]["best_set_weight"].(float64) != 0.01 {
		t.Errorf("TinyUp=%v", got[1]["best_set_weight"])
	}
	if got[2]["best_set_weight"].(float64) != 2.00 {
		t.Errorf("ExactInt=%v", got[2]["best_set_weight"])
	}
	if got[3]["best_set_weight"].(float64) != 1.23 {
		t.Errorf("TwoDp=%v", got[3]["best_set_weight"])
	}
	if got[4]["is_time_based"] != true {
		t.Errorf("is_time_based=%v", got[4]["is_time_based"])
	}

	pm := got[5]
	if pm["user_weight"].(float64) != 70.00 {
		t.Errorf("user_weight=%v", pm["user_weight"])
	}
	if pm["user_height"].(float64) != 175.00 {
		t.Errorf("user_height=%v", pm["user_height"])
	}
	if pm["user_age"] != 25 {
		t.Errorf("user_age=%v", pm["user_age"])
	}
	if pm["user_sex"] != "F" {
		t.Errorf("user_sex=%v", pm["user_sex"])
	}
}

func TestBuildProcessedStats_Imperial(t *testing.T) {
	stats := []*workout.IndividualExercise{
		{Name: "Zeroish", CurrentReps: 1, CurrentWeight: 1},
		{Name: "HalfPound", CurrentReps: 1, CurrentWeight: 227},
		{Name: "ThousandG", CurrentReps: 5, CurrentWeight: 1000},
	}
	profile := &user.Profile{Weight: 90400, Height: 1829, Age: 30, Sex: "M"}

	got := ai.BuildProcessedStats(stats, profile, "imperial")
	if len(got) != 4 {
		t.Fatalf("len=%d", len(got))
	}

	if got[0]["best_set_weight"].(float64) != 0.00 {
		t.Errorf("Zeroish=%v", got[0]["best_set_weight"])
	}
	if !almostEqual(got[1]["best_set_weight"].(float64), 0.50, 1e-9) {
		t.Errorf("HalfPound=%v", got[1]["best_set_weight"])
	}
	if got[2]["best_set_weight"].(float64) != 2.20 {
		t.Errorf("ThousandG=%v", got[2]["best_set_weight"])
	}

	pm := got[3]
	if pm["user_weight"].(float64) != 199.30 {
		t.Errorf("user_weight=%v", pm["user_weight"])
	}
	if pm["user_height"].(float64) != 6.00 {
		t.Errorf("user_height=%v", pm["user_height"])
	}
	if pm["user_age"] != 30 {
		t.Errorf("user_age=%v", pm["user_age"])
	}
	if pm["user_sex"] != "M" {
		t.Errorf("user_sex=%v", pm["user_sex"])
	}
}

func TestBuildProcessedStats_NilProfile(t *testing.T) {
	stats := []*workout.IndividualExercise{
		{Name: "A", CurrentReps: 1, CurrentWeight: 1000},
	}
	got := ai.BuildProcessedStats(stats, nil, "metric")
	if len(got) != 1 {
		t.Fatalf("len=%d", len(got))
	}
	if got[0]["exercise_name"] != "A" {
		t.Errorf("name=%v", got[0]["exercise_name"])
	}
}

func TestBuildProcessedCycle_ExercisesOptional(t *testing.T) {
	cycle := &workout.WorkoutCycle{
		Workouts: []*workout.Workout{
			{Name: "Empty", Completed: false, WorkoutExercises: []*workout.WorkoutExercise{}},
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
	if len(got) != 2 {
		t.Fatalf("len=%d", len(got))
	}

	if got[0]["workout_name"] != "Empty" {
		t.Errorf("w0=%v", got[0]["workout_name"])
	}
	if _, ok := got[0]["exercises"]; ok {
		t.Errorf("exercises present for empty workout")
	}

	if got[1]["workout_name"] != "Day 1" {
		t.Errorf("w1=%v", got[1]["workout_name"])
	}
	exs, ok := got[1]["exercises"].([]map[string]any)
	if !ok || len(exs) != 1 {
		t.Fatalf("exs=%v", got[1]["exercises"])
	}
	if exs[0]["exercise_name"] != "Bench" {
		t.Errorf("ex0=%v", exs[0]["exercise_name"])
	}
}

func almostEqual(a, b, eps float64) bool {
	return math.Abs(a-b) <= eps
}
