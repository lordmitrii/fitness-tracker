package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strings"

	"github.com/lordmitrii/golang-web-gin/internal/domain/ai"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"github.com/openai/openai-go/v3/shared"
)

type OpenAI struct {
	APIKey      string
	Temperature float64
}

func NewOpenAI(apiKey string, temperature float64) ai.OpenAI {
	return &OpenAI{
		APIKey:      apiKey,
		Temperature: temperature,
	}
}

func (o *OpenAI) CallOpenAIChat(ctx context.Context, input string, previousResponseID string, maxTokens int64) (string, string, error) {
	if o.APIKey == "" {
		return "", "", fmt.Errorf("api key not set for OpenAI")
	}

	client := openai.NewClient(option.WithAPIKey(o.APIKey))

	params := responses.ResponseNewParams{
		Model: openai.ChatModelGPT5Nano,
		// Temperature:     openai.Float(o.Temperature),
		MaxOutputTokens: openai.Int(maxTokens),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(input),
		},
		Instructions: openai.String("You are a pro fitness assistant who answers user questions. Your answers should be concise, relevant, and not emotional."),
		Store:        openai.Bool(true),
		Reasoning: shared.ReasoningParam{
			Effort: shared.ReasoningEffortLow,
		},
		Text: responses.ResponseTextConfigParam{
			Verbosity: responses.ResponseTextConfigVerbosityMedium,
		},
	}

	if previousResponseID != "" {
		params.PreviousResponseID = openai.String(previousResponseID)
	}

	resp, err := client.Responses.New(ctx, params)
	if err != nil {
		return "", "", fmt.Errorf("failed to call OpenAI API: %w", err)
	}

	return resp.OutputText(), resp.ID, nil
}

type exerciseWithMuscleGroupDto struct {
	// ID              uint   `json:"id"`
	Name            string `json:"name"`
	MuscleGroupName string `json:"muscle_group_name"`
	Slug            string `json:"slug"`
}

func (o *OpenAI) GenerateWorkoutPlan(
	ctx context.Context,
	input string,
	exercises []*workout.Exercise,
	maxTokens int64,
) (*workout.WorkoutPlan, error) {
	if o.APIKey == "" {
		return nil, fmt.Errorf("api key not set for OpenAI")
	}
	client := openai.NewClient(option.WithAPIKey(o.APIKey))

	exercisesClean := make([]*exerciseWithMuscleGroupDto, 0, len(exercises))
	for _, ex := range exercises {
		exercisesClean = append(exercisesClean, &exerciseWithMuscleGroupDto{
			// ID:              ex.ID,
			Name:            ex.Name,
			MuscleGroupName: ex.MuscleGroup.Name,
			Slug:            ex.Slug,
		})
	}

	exerciseListBytes, err := json.MarshalIndent(exercisesClean, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal exercise list: %w", err)
	}
	exerciseList := strings.Builder{}
	exerciseList.Write(exerciseListBytes)

	params := responses.ResponseNewParams{
		Model: openai.ChatModelGPT5Nano,
		// Temperature:     openai.Float(0.55),
		// MaxOutputTokens: openai.Int(maxTokens),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(input),
		},
		Instructions: openai.String("You are a certified strength coach. Output ONLY JSON valid to the provided JSON Schema. " +
			"Plan sessions ~45–75 minutes, respect user equipment and limitations, and use realistic rest_seconds and rep ranges. " +
			"When selecting exercises, ALWAYS pick from the provided list and use Slugs for exercises. NEVER make up exercises or exercise slugs." +
			"Exercise list: " + exerciseList.String()),
		Reasoning: shared.ReasoningParam{
			Effort: shared.ReasoningEffortLow,
		},
		Text: responses.ResponseTextConfigParam{
			Verbosity: responses.ResponseTextConfigVerbosityMedium,
		},
		Store: openai.Bool(true),
	}

	resp, err := client.Responses.New(
		ctx,
		params,
		option.WithJSONSet("text.format.type", "json_schema"),
		option.WithJSONSet("text.format.name", "WorkoutPlan"),
		option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
		option.WithJSONSet("text.format.strict", true),
	)
	if err != nil {
		return nil, fmt.Errorf("openai error: %w", err)
	}

	raw := resp.OutputText()
	if raw == "" {
		return nil, fmt.Errorf("empty model output")
	}

	var plan *workout.WorkoutPlan
	if err := json.Unmarshal([]byte(raw), &plan); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w; raw=%s", err, raw)
	}

	return plan, nil
}

type exerciseWithSlugDto struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (o *OpenAI) GenerateWorkoutPlanWithDB(
	ctx context.Context,
	input string,
	maxTokens int64,
	listMuscleGroups func(ctx context.Context, limit int) ([]string, error),
	searchExercises func(ctx context.Context, groupQuery string, limit, offset int) ([]map[string]any, error),
) (*workout.WorkoutPlan, error) {
	if o.APIKey == "" {
		return nil, fmt.Errorf("api key not set for OpenAI")
	}
	client := openai.NewClient(option.WithAPIKey(o.APIKey))

	tools := []any{
		map[string]any{
			"type":        "function",
			"name":        "list_muscle_groups",
			"description": "Return a list of available muscle-group names.",
			"parameters": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"properties": map[string]any{
					"limit": map[string]any{"type": "integer", "minimum": 1, "maximum": 100},
				},
			},
		},
		map[string]any{
			"type":        "function",
			"name":        "search_exercises_by_muscle_group",
			"description": "Find exercises by muscle-group name filter (e.g., 'chest'). Returns a small list.",
			"parameters": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"required":             []any{"group_query"},
				"properties": map[string]any{
					"group_query": map[string]any{"type": "string"},
					"limit":       map[string]any{"type": "integer", "minimum": 1, "maximum": 20},
					"offset":      map[string]any{"type": "integer", "minimum": 0},
				},
			},
		},
	}

	params := responses.ResponseNewParams{
		Model: openai.ChatModelGPT5Nano,
		// Temperature:     openai.Float(0.55),
		// MaxOutputTokens: openai.Int(maxTokens),
		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(input)},
		Instructions: openai.String(
			"You are a certified strength coach. " +
				"You need to create a workout plan using a mix of exercises for different muscle groups (depending on user prompt) from a database. " +
				"First, call list_muscle_groups (limit 100) to see available groups (returns { muscle_groups: string[] }). " +
				"When selecting exercises, ALWAYS call search_exercises_by_muscle_group (limit 20) (returns { exercises: {name:string,slug:string}[] }). " +
				"Finally, output ONLY JSON valid to the provided JSON Schema.",
		),
		// Reasoning: shared.ReasoningParam{
		// 	Effort: shared.ReasoningEffortLow,
		// },
		// Text: responses.ResponseTextConfigParam{
		// 	Verbosity: responses.ResponseTextConfigVerbosityMedium,
		// },
		Store: openai.Bool(true),
	}

	resp, err := client.Responses.New(
		ctx, params,
		option.WithJSONSet("tools", tools),
		option.WithJSONSet("tool_choice", "auto"),
		option.WithJSONSet("parallel_tool_calls", false),
		option.WithJSONSet("text.format.type", "json_schema"),
		option.WithJSONSet("text.format.name", "WorkoutPlan"),
		option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
		option.WithJSONSet("text.format.strict", true),
	)
	if err != nil {
		return nil, fmt.Errorf("openai error: %w", err)
	}

	var (
		lastMuscleGroups   []string
		lastMuscleGroupsLC []string
		hadSearchError     bool
		sawValidSearch     bool

		selectedGroups    = map[string]struct{}{}
		minDistinctGroups = 4
	)

	for range 15 { // max hops
		out, _ := extractLastAssistantJSON(resp)
		if out != "" {
			var plan *workout.WorkoutPlan
			if err := json.Unmarshal([]byte(out), &plan); err != nil {
				return nil, fmt.Errorf("invalid JSON: %w; raw=%s", err, out)
			}

			if !sawValidSearch {
				resp, err = client.Responses.New(
					ctx,
					responses.ResponseNewParams{
						Model:              openai.ChatModelGPT5Nano,
						PreviousResponseID: openai.String(resp.ID),
						// Reasoning: shared.ReasoningParam{
						// 	Effort: shared.ReasoningEffortLow,
						// },
						// Text: responses.ResponseTextConfigParam{
						// 	Verbosity: responses.ResponseTextConfigVerbosityLow,
						// },
					},
					option.WithJSONSet("input", []any{
						map[string]any{
							"type": "message", "role": "system",
							"content": "Before producing the final JSON, call search_exercises_by_muscle_group at least once.",
						},
					}),
					option.WithJSONSet("tools", tools),
					option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}),
					option.WithJSONSet("text.format.type", "json_schema"),
					option.WithJSONSet("text.format.name", "WorkoutPlan"),
					option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
					option.WithJSONSet("text.format.strict", true),
				)
				if err != nil {
					return nil, fmt.Errorf("openai error (retry enforce search): %w", err)
				}
				continue
			}

			needed := minInt(minDistinctGroups, len(lastMuscleGroups))
			if needed == 0 {
				resp, err = client.Responses.New(
					ctx,
					responses.ResponseNewParams{
						Model:              openai.ChatModelGPT5Nano,
						PreviousResponseID: openai.String(resp.ID),
						// Reasoning: shared.ReasoningParam{
						// 	Effort: shared.ReasoningEffortLow,
						// },
						// Text: responses.ResponseTextConfigParam{
						// 	Verbosity: responses.ResponseTextConfigVerbosityLow,
						// },
					},
					option.WithJSONSet("input", []any{
						map[string]any{
							"type": "message", "role": "system",
							"content": "Call list_muscle_groups first, then iteratively search distinct groups.",
						},
					}),
					option.WithJSONSet("tools", []any{tools[0]}),
					option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "list_muscle_groups"}),
					option.WithJSONSet("text.format.type", "json_schema"),
					option.WithJSONSet("text.format.name", "WorkoutPlan"),
					option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
					option.WithJSONSet("text.format.strict", true),
				)
				if err != nil {
					return nil, fmt.Errorf("openai error (enforce list first): %w", err)
				}
				continue
			}

			if len(selectedGroups) < needed {
				done := make([]string, 0, len(selectedGroups))
				doneSet := map[string]struct{}{}
				for g := range selectedGroups {
					done = append(done, g)
					doneSet[g] = struct{}{}
				}

				var remaining []string
				for _, g := range lastMuscleGroups {
					if _, ok := doneSet[strings.ToLower(g)]; !ok {
						remaining = append(remaining, g)
					}
				}
				resp, err = client.Responses.New(
					ctx,
					responses.ResponseNewParams{
						Model:              openai.ChatModelGPT5Nano,
						PreviousResponseID: openai.String(resp.ID),
						// Reasoning: shared.ReasoningParam{
						// 	Effort: shared.ReasoningEffortLow,
						// },
						// Text: responses.ResponseTextConfigParam{
						// 	Verbosity: responses.ResponseTextConfigVerbosityLow,
						// },
					},
					option.WithJSONSet("input", []any{
						map[string]any{
							"type": "message", "role": "system",
							"content": fmt.Sprintf(
								"You have searched %d distinct muscle groups: %v. "+
									"Search more DISTINCT groups until you reach at least %d in total. "+
									"Pick your next group from: %v",
								len(done), done, needed, remaining),
						},
					}),
					option.WithJSONSet("tools", []any{
						map[string]any{
							"type":        "function",
							"name":        "search_exercises_by_muscle_group",
							"description": "Find exercises by muscle-group name filter (e.g., 'chest'). Returns a small list.",
							"parameters": map[string]any{
								"type":                 "object",
								"additionalProperties": false,
								"required":             []any{"group_query"},
								"properties": map[string]any{
									"group_query": map[string]any{"type": "string", "enum": toAnySlice(remaining)},
									"limit":       map[string]any{"type": "integer", "minimum": 1, "maximum": 20},
									"offset":      map[string]any{"type": "integer", "minimum": 0},
								},
							},
						},
					}),
					option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}),
					option.WithJSONSet("text.format.type", "json_schema"),
					option.WithJSONSet("text.format.name", "WorkoutPlan"),
					option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
					option.WithJSONSet("text.format.strict", true),
				)
				if err != nil {
					return nil, fmt.Errorf("openai error (enforce multi-group search): %w", err)
				}
				continue
			}

			if len(selectedGroups) < minDistinctGroups {
				continue
			}

			return plan, nil
		}

		var raw map[string]any
		b, _ := json.Marshal(resp)
		_ = json.Unmarshal(b, &raw)
		toolCalls := collectToolCalls(raw)
		if len(toolCalls) == 0 {
			return nil, fmt.Errorf("no output and no tool calls in response")
		}

		var inputItems []map[string]any
		hadList := false
		hadSearchError = false

		for _, tc := range toolCalls {
			name := tc["name"].(string)
			args := tc["arguments"].(map[string]any)
			callID := firstNonEmpty(tc["call_id"], tc["id"])

			switch name {
			case "list_muscle_groups":
				hadList = true
				limit := intFrom(args["limit"], 100)
				names, err := listMuscleGroups(ctx, limit)
				if err != nil {
					return nil, err
				}
				lastMuscleGroups = names
				lastMuscleGroupsLC = toLowerSlice(names)

				payload := map[string]any{"muscle_groups": names}
				inputItems = append(inputItems, map[string]any{
					"type": "function_call_output", "call_id": callID, "output": string(mustJSON(payload)),
				})
				inputItems = append(inputItems, map[string]any{
					"type": "message", "role": "system",
					"content": fmt.Sprintf(
						"Iteratively call search_exercises_by_muscle_group for DISTINCT muscle groups from this list. "+
							"Gather enough exercises to assemble a complete multi-day plan. Pick one group at a time, then repeat. "+
							"Available groups: %v", lastMuscleGroups),
				})

			case "search_exercises_by_muscle_group":
				q := strings.TrimSpace(strings.ToLower(stringFrom(args["group_query"], "")))
				limit := intFrom(args["limit"], 10)
				offset := intFrom(args["offset"], 0)

				if !containsLower(lastMuscleGroupsLC, q) {
					hadSearchError = true
					errPayload := map[string]any{
						"error":                 "unknown_muscle_group",
						"message":               "Pick a muscle_group from the provided list.",
						"allowed_muscle_groups": lastMuscleGroups,
						"received":              stringFrom(args["group_query"], ""),
					}
					inputItems = append(inputItems, map[string]any{
						"type": "function_call_output", "call_id": callID, "output": string(mustJSON(errPayload)),
					})
					continue
				}

				rows, err := searchExercises(ctx, q, limit, offset)
				rowsClean := make([]*exerciseWithSlugDto, 0, len(rows))
				for _, r := range rows {
					rowsClean = append(rowsClean, &exerciseWithSlugDto{
						Name: r["name"].(string),
						Slug: r["slug"].(string),
					})
				}

				if err != nil {
					return nil, err
				}
				sawValidSearch = true
				selectedGroups[q] = struct{}{}

				payload := map[string]any{"exercises": rowsClean}
				inputItems = append(inputItems, map[string]any{
					"type": "function_call_output", "call_id": callID, "output": string(mustJSON(payload)),
				})

			default:
				// noop
			}
		}

		followupOpts := []option.RequestOption{
			option.WithJSONSet("input", inputItems),
			option.WithJSONSet("text.format.type", "json_schema"),
			option.WithJSONSet("text.format.name", "WorkoutPlan"),
			option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
			option.WithJSONSet("text.format.strict", true),
		}

		needed := minInt(minDistinctGroups, len(lastMuscleGroups))
		if hadSearchError && len(lastMuscleGroups) > 0 {
			restrictedSearchTool := []any{
				map[string]any{
					"type":        "function",
					"name":        "search_exercises_by_muscle_group",
					"description": "Find exercises by muscle-group name filter (e.g., 'chest'). Returns a small list.",
					"parameters": map[string]any{
						"type":                 "object",
						"additionalProperties": false,
						"required":             []any{"group_query"},
						"properties": map[string]any{
							"group_query": map[string]any{"type": "string", "enum": toAnySlice(lastMuscleGroups)},
							"limit":       map[string]any{"type": "integer", "minimum": 1, "maximum": 20},
							"offset":      map[string]any{"type": "integer", "minimum": 0},
						},
					},
				},
			}
			followupOpts = append(
				followupOpts,
				option.WithJSONSet("tools", restrictedSearchTool),
				option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}),
			)
		} else if hadList && len(selectedGroups) < needed {
			var remaining []string
			for _, g := range lastMuscleGroups {
				if _, ok := selectedGroups[strings.ToLower(g)]; !ok {
					remaining = append(remaining, g)
				}
			}
			restrictedSearchTool := []any{
				map[string]any{
					"type":        "function",
					"name":        "search_exercises_by_muscle_group",
					"description": "Find exercises by muscle-group name filter (e.g., 'chest'). Returns a small list.",
					"parameters": map[string]any{
						"type":                 "object",
						"additionalProperties": false,
						"required":             []any{"group_query"},
						"properties": map[string]any{
							"group_query": map[string]any{"type": "string", "enum": toAnySlice(remaining)},
							"limit":       map[string]any{"type": "integer", "minimum": 1, "maximum": 20},
							"offset":      map[string]any{"type": "integer", "minimum": 0},
						},
					},
				},
			}
			followupOpts = append(
				followupOpts,
				option.WithJSONSet("tools", restrictedSearchTool),
				option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}),
			)
		} else {
			followupOpts = append(followupOpts, option.WithJSONSet("tool_choice", "auto"))
		}

		resp, err = client.Responses.New(
			ctx,
			responses.ResponseNewParams{
				Model:              openai.ChatModelGPT5Nano,
				PreviousResponseID: openai.String(resp.ID),
				Reasoning: shared.ReasoningParam{
					Effort: shared.ReasoningEffortLow,
				},
				Text: responses.ResponseTextConfigParam{
					Verbosity: responses.ResponseTextConfigVerbosityLow,
				},
			},
			followupOpts...,
		)
		if err != nil {
			return nil, fmt.Errorf("openai error (input): %w", err)
		}
	}

	return nil, fmt.Errorf("too many tool-call hops without final output")
}

func toAnySlice(ss []string) []any {
	out := make([]any, len(ss))
	for i, s := range ss {
		out[i] = s
	}
	return out
}

func toLowerSlice(ss []string) []string {
	out := make([]string, len(ss))
	for i, s := range ss {
		out[i] = strings.ToLower(s)
	}
	return out
}

func containsLower(ssLC []string, sLC string) bool {
	return slices.Contains(ssLC, sLC)
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func collectToolCalls(raw map[string]any) (calls []map[string]any) {
	out, _ := raw["output"].([]any)
	for _, item := range out {
		im, _ := item.(map[string]any)

		if im["type"] == "function_call" && im["name"] != nil {
			name, _ := im["name"].(string)
			callID, _ := im["call_id"].(string)
			args := im["arguments"]

			var argMap map[string]any
			switch a := args.(type) {
			case string:
				_ = json.Unmarshal([]byte(a), &argMap)
			case map[string]any:
				argMap = a
			case nil:
				argMap = map[string]any{}
			}

			calls = append(calls, map[string]any{
				"name":      name,
				"id":        callID,
				"call_id":   callID,
				"arguments": argMap,
			})
			continue
		}

		if content, ok := im["content"].([]any); ok {
			for _, p := range content {
				pm, _ := p.(map[string]any)
				if pm["type"] == "tool_call" {
					body, _ := pm["tool_call"].(map[string]any)
					if body != nil && body["name"] != nil {
						switch a := body["arguments"].(type) {
						case string:
							var obj map[string]any
							_ = json.Unmarshal([]byte(a), &obj)
							body["arguments"] = obj
						case nil:
							body["arguments"] = map[string]any{}
						}
						calls = append(calls, body)
					}
				}
			}
		}
	}
	return
}

func intFrom(v any, def int) int {
	switch t := v.(type) {
	case float64:
		return int(t)
	case int:
		return t
	default:
		return def
	}
}

func stringFrom(v any, def string) string {
	if s, ok := v.(string); ok {
		return s
	}
	return def
}

func firstNonEmpty(vals ...any) string {
	for _, v := range vals {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return ""
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

// extractLastAssistantJSON returns the last assistant JSON text block, if any.
func extractLastAssistantJSON(resp *responses.Response) (string, error) {
	if resp == nil {
		return "", fmt.Errorf("nil response")
	}

	// Shortcut: OpenAI SDK usually gives the final assistant text here
	if txt := resp.OutputText(); txt != "" {
		return strings.TrimSpace(txt), nil
	}

	// Fallback: walk the raw "output" array
	var raw map[string]any
	b, _ := json.Marshal(resp)
	_ = json.Unmarshal(b, &raw)

	outs, _ := raw["output"].([]any)
	var last string
	for _, it := range outs {
		m, _ := it.(map[string]any)
		if m["type"] != "message" {
			continue
		}

		if role, _ := m["role"].(string); role != "assistant" {
			continue
		}

		// Each assistant message can have several "content" parts
		content, _ := m["content"].([]any)
		for _, c := range content {
			cm, _ := c.(map[string]any)
			if cm["type"] == "output_text" || cm["type"] == "text" {
				if s, ok := cm["text"].(string); ok {
					last = s
				}
			}
		}
	}

	if last == "" {
		return "", fmt.Errorf("no assistant JSON text found")
	}
	return strings.TrimSpace(last), nil
}
