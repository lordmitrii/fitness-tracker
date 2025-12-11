package graphapi

import "context"

type ctxKey string

const userIDCtxKey ctxKey = "userID"

func WithUserID(ctx context.Context, userID uint) context.Context {
	return context.WithValue(ctx, userIDCtxKey, userID)
}

func UserIDFromCtx(ctx context.Context) (uint, bool) {
	v := ctx.Value(userIDCtxKey)
	if v == nil {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}
