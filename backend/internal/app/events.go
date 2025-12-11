package app

import (
	"context"

	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
	"github.com/lordmitrii/golang-web-gin/internal/events"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
	"gorm.io/gorm"
)

// RegisterEvents wires synchronous and asynchronous event handlers for the app.
func RegisterEvents(ctx context.Context, db *gorm.DB, bus eventbus.Bus, dispatcher *domainevt.Dispatcher, workoutService usecase.WorkoutService) {
	events.RegisterSyncAll(events.SyncDeps{
		Dispatcher:     dispatcher,
		WorkoutService: workoutService,
	})

	events.RegisterAll(ctx, events.Deps{
		DB:             db,
		Bus:            bus,
		WorkoutService: workoutService,
	})
}
