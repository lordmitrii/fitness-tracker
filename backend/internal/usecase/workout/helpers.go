package workout

func toAnySlice[T any](xs []T) []any {
	out := make([]any, len(xs))
	for i, v := range xs { out[i] = v }
	return out
}
