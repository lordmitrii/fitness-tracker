package txctx

import (
	"context"
	"gorm.io/gorm"
)

type key struct{}

func WithTx(ctx context.Context, tx *gorm.DB) context.Context {
	return context.WithValue(ctx, key{}, tx)
}

func From(ctx context.Context) (*gorm.DB, bool) {
	tx, ok := ctx.Value(key{}).(*gorm.DB)
	return tx, ok
}
