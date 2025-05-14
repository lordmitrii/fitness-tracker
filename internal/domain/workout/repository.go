package workout

import "context"

type Repository interface {
	Create(ctx context.Context, w *Workout) error
	GetByID(ctx context.Context, id uint) (*Workout, error)
	GetAll(ctx context.Context) ([]*Workout, error)
	Update(ctx context.Context, w *Workout) error
	Delete(ctx context.Context, id uint) error
}
