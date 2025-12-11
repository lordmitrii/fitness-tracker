package events

import (
	"context"
	"gorm.io/gorm"

	"github.com/lordmitrii/golang-web-gin/internal/events/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/eventbus"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type Deps struct {
	DB             *gorm.DB
	Bus            eventbus.Bus
	WorkoutService usecase.WorkoutService
	// Add other concrete services only as needed per module
}

func RegisterAll(_ context.Context, d Deps) {
	// Each domain registers itself
	workout.New(d.DB, d.WorkoutService).Register(d.Bus)

	// userevents.New(d.DB, d.EmailSvc, d.Analytics).Register(d.Bus)
	// rbacEvents.New(d.DB, d.AuditSvc).Register(d.Bus)
	// ...
}
