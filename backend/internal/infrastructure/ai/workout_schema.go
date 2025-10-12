package ai

func WorkoutPlanJSONSchema() map[string]any {
	return map[string]any{
		"description":          "A structured workout plan organized by numbered cycle days.",
		"type":                 "object",
		"additionalProperties": false,
		"properties": map[string]any{
			"name": map[string]any{
				"type":        "string",
				"description": "Name of the workout plan",
				"minLength":   1,
			},
			"days_per_cycle": map[string]any{
				"type":        "integer",
				"description": "Number of days in each workout cycle",
				"minimum":     1,
			},
			"workouts_in_a_cycle": map[string]any{
				"type":          "object",
				"description":   "Map of day-number (as a string) to day details.",
				"patternProperties": map[string]any{
					"^[1-9]\\d*$": map[string]any{
						"type":                 "object",
						"additionalProperties": false,
						"properties": map[string]any{
							"name": map[string]any{
								"type":        "string",
								"description": "Display name of the day (e.g., 'Day 1')",
								"minLength":   1,
							},
							"exercises": map[string]any{
								"type":        "array",
								"description": "Ordered list of exercises for the day",
								"minItems":    1,
								"items": map[string]any{
									"type":                 "object",
									"additionalProperties": false,
									"properties": map[string]any{
										"slug": map[string]any{
											"type":        "string",
											"description": "Exercise slug",
										},
										"sets": map[string]any{
											"type":        "integer",
											"description": "Number of sets for the exercise",
											"minimum":     1,
										},
									},
									"required": []any{"slug", "sets"},
								},
							},
						},
						"required": []any{"name", "exercises"},
					},
				},
				"properties":           map[string]any{},
				"required":             []any{},
				"additionalProperties": false,
			},
		},
		"required": []any{"name", "days_per_cycle", "workouts_in_a_cycle"},
		"examples": []any{
			map[string]any{
				"name":           "Fat Loss Workout Plan",
				"days_per_cycle": 2,
				"workouts_in_a_cycle": map[string]any{
					"1": map[string]any{
						"name": "Day 1",
						"exercises": []any{
							map[string]any{"id": 2, "sets": 1},
							map[string]any{"id": 52, "sets": 3},
							map[string]any{"id": 12, "sets": 3},
							map[string]any{"id": 22, "sets": 3},
							map[string]any{"id": 32, "sets": 3},
							map[string]any{"id": 42, "sets": 1},
						},
					},
					"2": map[string]any{
						"name": "Day 2",
						"exercises": []any{
							map[string]any{"id": 2, "sets": 1},
							map[string]any{"id": 52, "sets": 3},
							map[string]any{"id": 12, "sets": 3},
							map[string]any{"id": 22, "sets": 3},
							map[string]any{"id": 32, "sets": 3},
							map[string]any{"id": 42, "sets": 1},
						},
					},
				},
			},
		},
	}
}
