package ai

func WorkoutPlanJSONSchema() map[string]any {
	return map[string]any{
		"description":          "A structured workout plan with a single cycle ('Week 1') containing workouts (days).",
		"type":                 "object",
		"additionalProperties": false,
		"properties": map[string]any{
			"name": map[string]any{
				"type":        "string",
				"description": "Name of the workout plan",
				"minLength":   1,
			},
			"workout_cycles": map[string]any{
				"type":        "array",
				"description": "Exactly one cycle named 'Week 1'.",
				"minItems":    1,
				"maxItems":    1,
				"items": map[string]any{
					"type":                 "object",
					"additionalProperties": false,
					"properties": map[string]any{
						"name": map[string]any{
							"type":  "string",
							"const": "Week 1",
						},
						"workouts": map[string]any{
							"type":        "array",
							"description": "Ordered list of workouts (days) in Week 1.",
							"minItems":    1,
							"items": map[string]any{
								"type":                 "object",
								"additionalProperties": false,
								"properties": map[string]any{
									"name": map[string]any{
										"type":        "string",
										"description": "Workout name (e.g., 'Day 1')",
										"minLength":   1,
									},
									"workout_exercises": map[string]any{
										"type":        "array",
										"description": "Ordered list of exercises for this workout.",
										"minItems":    1,
										"items": map[string]any{
											"type":                 "object",
											"additionalProperties": false,
											"properties": map[string]any{
												"slug": map[string]any{
													"type":        "string",
													"description": "Exercise slug",
													"minLength":   1,
												},
												"sets_qt": map[string]any{
													"type":        "integer",
													"description": "Number of sets for the exercise",
													"minimum":     1,
												},
											},
											"required": []any{"slug", "sets_qt"},
										},
									},
								},
								"required": []any{"name", "workout_exercises"},
							},
						},
					},
					"required": []any{"name", "workouts"},
				},
				"additionalItems": false, // for older drafts; harmless alongside maxItems
			},
		},
		"required": []any{"name", "workout_cycles"},
		"examples": []any{
			map[string]any{
				"name": "Biceps Focus (3-day)",
				"workout_cycles": []any{
					map[string]any{
						"name": "Week 1",
						"workouts": []any{
							map[string]any{
								"name": "Day 1",
								"workout_exercises": []any{
									map[string]any{"slug": "barbell-curl", "sets_qt": 3},
									map[string]any{"slug": "incline-dumbbell-curl", "sets_qt": 3},
								},
							},
						},
					},
				},
			},
		},
	}
}
