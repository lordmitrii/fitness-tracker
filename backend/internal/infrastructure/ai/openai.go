package ai

import (
	"context"
	"encoding/json"
	"fmt"
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
) (*ai.WorkoutPlanDto, error) {
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

	var plan *ai.WorkoutPlanDto
	if err := json.Unmarshal([]byte(raw), &plan); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w; raw=%s", err, raw)
	}

	return plan, nil
}

type exerciseWithSlugDto struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type state struct {
	lastMuscleGroups   []string
	lastMuscleGroupsLC []string
	selectedGroups     map[string]struct{}
	sawValidSearch     bool
	hadListThisHop     bool
	hadSearchError     bool
}

const (
	model             = openai.ChatModelGPT5Nano
	maxHops           = 15
	minDistinctGroups = 4
)

func (o *OpenAI) GenerateWorkoutPlanWithDB(
	ctx context.Context,
	input string,
	maxTokens int64,
	listMuscleGroups func(ctx context.Context, limit int) ([]string, error),
	searchExercises func(ctx context.Context, groupQuery string, limit, offset int) ([]map[string]any, error),
) (*ai.WorkoutPlanDto, error) {
	if o.APIKey == "" {
		return nil, fmt.Errorf("api key not set for OpenAI")
	}
	client := openai.NewClient(option.WithAPIKey(o.APIKey))

	schemaStrict := func() []option.RequestOption {
		return []option.RequestOption{
			option.WithJSONSet("text.format.type", "json_schema"),
			option.WithJSONSet("text.format.name", "WorkoutPlan"),
			option.WithJSONSet("text.format.schema", WorkoutPlanJSONSchema()),
			option.WithJSONSet("text.format.strict", true),
		}
	}

	schemaNone := func() []option.RequestOption {
		return []option.RequestOption{
			option.WithJSONSet("text.format.type", "text"),
		}
	}

	toolList := func() any {
		return map[string]any{
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
		}
	}
	toolSearch := func(enumGroups []string) any {
		params := map[string]any{
			"type":                 "object",
			"additionalProperties": false,
			"required":             []any{"group_query"},
			"properties": map[string]any{
				"group_query": map[string]any{"type": "string"},
				"limit":       map[string]any{"type": "integer", "minimum": 1, "maximum": 20},
				"offset":      map[string]any{"type": "integer", "minimum": 0},
			},
		}
		if len(enumGroups) > 0 {
			params["properties"].(map[string]any)["group_query"] = map[string]any{
				"type": "string", "enum": toAnySlice(enumGroups),
			}
		}
		return map[string]any{
			"type":        "function",
			"name":        "search_exercises_by_muscle_group",
			"description": "Find exercises by muscle-group name filter (e.g., 'chest'). Returns a small list.",
			"parameters":  params,
		}
	}
	baseTools := []any{toolList(), toolSearch(nil)}

	// start the conversation with the user prompt
	startParams := responses.ResponseNewParams{
		Model: model,
		// MaxOutputTokens: openai.Int(maxTokens),
		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(input)},
		Instructions: openai.String(
			"You are a certified strength coach. " +
				"Create a workout plan using exercises from a DB. " +
				"First, call list_muscle_groups (limit 100) to see available groups (returns { muscle_groups: string[] }). " +
				"When selecting exercises, ALWAYS call search_exercises_by_muscle_group (limit 20) (returns { exercises: {name:string,slug:string}[] }). " +
				"Finally, output ONLY JSON valid to the provided JSON Schema.",
		),
		Reasoning: shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
		Text:      responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityMedium},
		Store:     openai.Bool(true),
	}
	resp, err := client.Responses.New(
		ctx, startParams,
		append(schemaNone(),
			option.WithJSONSet("tools", baseTools),
			option.WithJSONSet("tool_choice", "auto"),
			option.WithJSONSet("parallel_tool_calls", false),
		)...,
	)
	if err != nil {
		return nil, fmt.Errorf("openai error: %w", err)
	}

	st := state{
		selectedGroups: make(map[string]struct{}),
	}

	neededDistinct := func() int {
		return minInt(minDistinctGroups, len(st.lastMuscleGroups))
	}

	// Follow up on tool calls, up to maxHops times
	for range maxHops {
		// If the api already produced final JSON, try to return (if constraints are satisfied)
		if out, _ := extractLastAssistantJSON(resp); out != "" {

			if len(st.selectedGroups) < neededDistinct() || !st.sawValidSearch || neededDistinct() == 0 {

				// Rule 1: At least one search must have happened before accepting JSON
				if !st.sawValidSearch {
					resp, err = forceAtLeastOneSearch(ctx, client, resp.ID, schemaNone(), baseTools)
					if err != nil {
						return nil, fmt.Errorf("openai error (retry enforce search): %w", err)
					}
					continue
				}

				// Rule 2: We must have n distinct groups searched (if we never listed groups, ask to list first)
				if neededDistinct() == 0 {
					resp, err = forceListThenSearch(ctx, client, resp.ID, schemaNone(), toolList())
					if err != nil {
						return nil, fmt.Errorf("openai error (enforce list first): %w", err)
					}
					continue
				}
				// If we have not yet searched all distinct groups, we need to keep going
				if len(st.selectedGroups) < neededDistinct() {
					remaining := remainingGroups(st.lastMuscleGroups, st.selectedGroups)
					msg := sysMsg(fmt.Sprintf(
						"Do NOT produce the final JSON yet. "+
							"You must search at least %d DISTINCT muscle groups; you have %d. "+
							"Pick your NEXT group from this list and call search_exercises_by_muscle_group: %v",
						neededDistinct(), len(st.selectedGroups), remaining,
					))
					resp, err = client.Responses.New(
						ctx,
						responses.ResponseNewParams{
							Model:              model,
							PreviousResponseID: openai.String(resp.ID),
							Reasoning:          shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
							Text:               responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityLow},
						},
						append(schemaNone(),
							option.WithJSONSet("input", []any{msg}),
							option.WithJSONSet("tools", []any{toolSearch(remaining)}),
							option.WithJSONSet("tool_choice", map[string]any{
								"type": "function", "name": "search_exercises_by_muscle_group",
							}),
						)...,
					)
					if err != nil {
						return nil, fmt.Errorf("openai error (enforce multi-group search): %w", err)
					}
					continue
				}
			}
			// All good, finalize
			finalMsg := sysMsg("You now have enough distinct groups. Produce EXACTLY ONE final JSON object that conforms to the WorkoutPlan schema. Do not include any extra text.")
			resp, err = client.Responses.New(
				ctx,
				responses.ResponseNewParams{
					Model:              model,
					PreviousResponseID: openai.String(resp.ID),
					Reasoning:          shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
					Text:               responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityLow},
				},
				append(schemaStrict(),
					option.WithJSONSet("input", []any{finalMsg}),
					option.WithJSONSet("tool_choice", "none"),
				)...,
			)
			if err != nil {
				return nil, fmt.Errorf("openai error (finalize): %w", err)
			}

			var plan ai.WorkoutPlanDto
			out, _ := extractLastAssistantJSON(resp)
			if err := UnmarshalLastJSONObject(out, &plan); err != nil {
				return nil, fmt.Errorf("invalid JSON (final): %w; raw=%s", err, out)
			}
			return &plan, nil
		}

		// Otherwise check for tool calls in the response
		raw := make(map[string]any)
		_ = json.Unmarshal(mustJSON(resp), &raw)
		toolCalls := collectToolCalls(raw)
		if len(toolCalls) == 0 {
			return nil, fmt.Errorf("no output and no tool calls in response")
		}

		inputItems, followUpTools, toolChoice := handleToolCalls(
			ctx, toolCalls, &st, toolSearch, listMuscleGroups, searchExercises,
		)

		// Make follow-up request
		opts := []option.RequestOption{
			option.WithJSONSet("input", inputItems),
			option.WithJSONSet("tool_choice", toolChoice),
		}
		if len(followUpTools) > 0 {
			opts = append(opts, option.WithJSONSet("tools", followUpTools))
		}
		opts = append(opts, schemaNone()...)

		resp, err = client.Responses.New(
			ctx,
			responses.ResponseNewParams{
				Model:              model,
				PreviousResponseID: openai.String(resp.ID),
				Reasoning:          shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
				Text:               responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityLow},
			},
			opts...,
		)
		if err != nil {
			return nil, fmt.Errorf("openai error (input): %w", err)
		}

	}

	// If we reach here, we exceeded maxHops
	return nil, fmt.Errorf("too many tool-call hops without final output")
}

func handleToolCalls(
	ctx context.Context,
	toolCalls []map[string]any,
	st *state,
	toolSearch func(enumGroups []string) any,
	listMuscleGroups func(ctx context.Context, limit int) ([]string, error),
	searchExercises func(ctx context.Context, groupQuery string, limit, offset int) ([]map[string]any, error),
) (inputItems []map[string]any, followUpTools []any, toolChoice any) {
	inputItems = make([]map[string]any, 0, len(toolCalls)+1)
	st.hadListThisHop = false
	st.hadSearchError = false

	for _, tc := range toolCalls {
		name := tc["name"].(string)
		args := tc["arguments"].(map[string]any)
		callID := firstNonEmpty(tc["call_id"], tc["id"])

		switch name {
		case "list_muscle_groups":
			st.hadListThisHop = true
			limit := intFrom(args["limit"], 100)

			names, err := listMuscleGroups(ctx, limit)
			if err != nil {
				inputItems = append(inputItems, toolErr(callID, "list_muscle_groups_failed", err.Error()))
				continue
			}
			st.lastMuscleGroups = names
			st.lastMuscleGroupsLC = toLowerSlice(names)

			payload := map[string]any{"muscle_groups": names}
			inputItems = append(inputItems, toolOK(callID, payload))
			inputItems = append(inputItems, sysMsg(
				"Iteratively call search_exercises_by_muscle_group for DISTINCT muscle groups from this list. "+
					"Gather enough exercises to assemble a complete multi-day plan. Pick one group at a time, then repeat. "+
					fmt.Sprintf("Available groups: %v", st.lastMuscleGroups)),
			)

		case "search_exercises_by_muscle_group":
			q := strings.TrimSpace(strings.ToLower(stringFrom(args["group_query"], "")))
			limit := intFrom(args["limit"], 10)
			offset := intFrom(args["offset"], 0)

			// Validate against last muscle groups
			if !containsLower(st.lastMuscleGroupsLC, q) {
				st.hadSearchError = true
				inputItems = append(inputItems, toolOK(callID, map[string]any{
					"error":                 "unknown_muscle_group",
					"message":               "Pick a muscle_group from the provided list.",
					"allowed_muscle_groups": st.lastMuscleGroups,
					"received":              stringFrom(args["group_query"], ""),
				}))
				continue
			}

			rows, err := searchExercises(ctx, q, limit, offset)
			if err != nil {
				inputItems = append(inputItems, toolErr(callID, "search_exercises_failed", err.Error()))
				continue
			}
			clean := make([]*exerciseWithSlugDto, 0, len(rows))
			for _, r := range rows {
				clean = append(clean, &exerciseWithSlugDto{
					Name: r["name"].(string),
					Slug: r["slug"].(string),
				})
			}
			inputItems = append(inputItems, toolOK(callID, map[string]any{"exercises": clean}))
			st.sawValidSearch = true
			st.selectedGroups[q] = struct{}{}

		default:
			// noop for unknown tools
		}
	}

	needed := minInt(minDistinctGroups, len(st.lastMuscleGroups))
	switch {
	case st.hadSearchError && len(st.lastMuscleGroups) > 0:
		followUpTools = []any{toolSearch(st.lastMuscleGroups)}
		toolChoice = map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}

	case st.hadListThisHop && len(st.selectedGroups) < needed:
		remaining := remainingGroups(st.lastMuscleGroups, st.selectedGroups)
		followUpTools = []any{toolSearch(remaining)}
		toolChoice = map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}

	default:
		toolChoice = "auto"
	}

	return inputItems, followUpTools, toolChoice
}

func forceAtLeastOneSearch(
	ctx context.Context,
	client openai.Client,
	prevID string,
	schemaOpts []option.RequestOption,
	tools []any,
) (*responses.Response, error) {
	return client.Responses.New(
		ctx,
		responses.ResponseNewParams{
			Model:              openai.ChatModelGPT5Nano,
			PreviousResponseID: openai.String(prevID),
			Reasoning:          shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
			Text:               responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityLow},
		},
		append(schemaOpts,
			option.WithJSONSet("input", []any{
				sysMsg("Before producing the final JSON, call search_exercises_by_muscle_group at least once."),
			}),
			option.WithJSONSet("tools", tools),
			option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "search_exercises_by_muscle_group"}),
		)...,
	)
}

func forceListThenSearch(
	ctx context.Context,
	client openai.Client,
	prevID string,
	schemaOpts []option.RequestOption,
	listTool any,
) (*responses.Response, error) {
	return client.Responses.New(
		ctx,
		responses.ResponseNewParams{
			Model:              openai.ChatModelGPT5Nano,
			PreviousResponseID: openai.String(prevID),
			Reasoning:          shared.ReasoningParam{Effort: shared.ReasoningEffortLow},
			Text:               responses.ResponseTextConfigParam{Verbosity: responses.ResponseTextConfigVerbosityLow},
		},
		append(schemaOpts,
			option.WithJSONSet("input", []any{
				sysMsg("Call list_muscle_groups first, then iteratively search distinct groups."),
			}),
			option.WithJSONSet("tools", []any{listTool}),
			option.WithJSONSet("tool_choice", map[string]any{"type": "function", "name": "list_muscle_groups"}),
		)...,
	)
}

func extractLastAssistantJSON(resp *responses.Response) (string, error) {
	if resp == nil {
		return "", fmt.Errorf("nil response")
	}

	if txt := resp.OutputText(); txt != "" {
		return strings.TrimSpace(txt), nil
	}

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
