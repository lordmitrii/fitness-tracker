package uow

import (
	"context"
	"fmt"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
)

func Do(ctx context.Context, db *gorm.DB, fn func(ctx context.Context) error) error {
	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(txctx.WithTx(ctx, tx))
	})
}

func DoR[T any](ctx context.Context, db *gorm.DB, fn func(ctx context.Context) (T, error)) (T, error) {
	var zero T
	var out T
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res, err := fn(txctx.WithTx(ctx, tx))
		if err != nil {
			return err
		}
		out = res
		return nil
	})
	if err != nil {
		return zero, err
	}
	return out, nil
}

func DoIfNotInTx(ctx context.Context, db *gorm.DB, fn func(ctx context.Context) error) error {
	if _, ok := txctx.From(ctx); ok {
		return fn(ctx)
	}
	return Do(ctx, db, fn)
}

func DoRIfNotInTx[T any](ctx context.Context, db *gorm.DB, fn func(ctx context.Context) (T, error)) (T, error) {
	if _, ok := txctx.From(ctx); ok {
		return fn(ctx)
	}
	return DoR(ctx, db, fn)
}

func MustInTx(ctx context.Context) error {
	if _, ok := txctx.From(ctx); ok {
		return nil
	}
	return fmt.Errorf("not in transaction")
}
