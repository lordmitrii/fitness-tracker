package ai

type WorkoutPlanDto struct {
	Name          string               `json:"name"`
	WorkoutCycles []WorkoutCycleDto    `json:"workout_cycles"`
}

type WorkoutCycleDto struct {
	Name     string              `json:"name"`
	Workouts []WorkoutDto        `json:"workouts"`
}

type WorkoutDto struct {
	Name            string                `json:"name"`
	WorkoutExercises []WorkoutExerciseDto `json:"workout_exercises"`
}

type WorkoutExerciseDto struct {
	Slug    string `json:"slug"`
	SetsQt  int    `json:"sets_qt"`
}
