package translations

import (
	"strings"
)


func splitOrDefault(q string, def []string) []string {
	if strings.TrimSpace(q) == "" {
		return def
	}
	parts := strings.Split(q, ",")
	out := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, p := range parts {
		b := baseLang(strings.TrimSpace(p))
		if b == "" {
			continue
		}
		if _, ok := seen[b]; !ok {
			seen[b] = struct{}{}
			out = append(out, b)
		}
	}
	if len(out) == 0 {
		return def
	}
	return out
}

func baseLang(l string) string {
	l = strings.ToLower(strings.TrimSpace(l))
	if l == "" {
		return l
	}
	if i := strings.IndexByte(l, '-'); i > 0 {
		return l[:i]
	}
	return l
}