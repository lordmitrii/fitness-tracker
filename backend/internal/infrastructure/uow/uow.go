package uow

import (
	"context"
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/db/txctx"
	"gorm.io/gorm"
)

// Manager wraps GORM transactions and exposes a TxManager implementation.
type Manager struct {
	db *gorm.DB
}

func NewManager(db *gorm.DB) *Manager {
	return &Manager{db: db}
}

func (m *Manager) Do(ctx context.Context, fn func(ctx context.Context) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(txctx.WithTx(ctx, tx))
	})
}

func (m *Manager) DoIfNotInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	if _, ok := txctx.From(ctx); ok {
		return fn(ctx)
	}
	return m.Do(ctx, fn)
}

func MustInTx(ctx context.Context) error {
	if _, ok := txctx.From(ctx); ok {
		return nil
	}
	return fmt.Errorf("not in transaction")
}
