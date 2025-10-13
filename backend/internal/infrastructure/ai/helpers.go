package ai

import (
	"encoding/json"
	"io"
	"slices"
	"strings"
)

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
func mustJSON(v any) []byte { b, _ := json.Marshal(v); return b }

func remainingGroups(all []string, selected map[string]struct{}) []string {
	var out []string
	for _, g := range all {
		if _, ok := selected[strings.ToLower(g)]; !ok {
			out = append(out, g)
		}
	}
	return out
}

func toolOK(callID string, payload map[string]any) map[string]any {
	return map[string]any{
		"type":    "function_call_output",
		"call_id": callID,
		"output":  string(mustJSON(payload)),
	}
}
func toolErr(callID, code, message string) map[string]any {
	return toolOK(callID, map[string]any{"error": code, "message": message})
}
func sysMsg(text string) map[string]any {
	return map[string]any{"type": "message", "role": "system", "content": text}
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

func UnmarshalLastJSONObject[T any](s string, out *T) error {
	s = stripCodeFences(s)

	dec := json.NewDecoder(strings.NewReader(s))
	dec.UseNumber()

	var last json.RawMessage
	for {
		var v json.RawMessage
		if err := dec.Decode(&v); err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if len(v) > 0 {
			last = v
		}
	}
	if len(last) == 0 {
		return io.EOF
	}
	return json.Unmarshal(last, out)
}

func stripCodeFences(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```") {
		if idx := strings.Index(s, "\n"); idx >= 0 {
			s = s[idx+1:]
		}
		s = strings.TrimSuffix(strings.TrimSpace(s), "```")
	}
	return s
}
