package translations

import (
	"context"
)

type Translator interface {
	Translate(ctx context.Context, key, lang string) (string, error)
}
