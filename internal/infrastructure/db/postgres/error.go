package postgres

import (
	"errors"
)

var ErrNotFound = errors.New("data not found")
var ErrUserNotFound = errors.New("user not found")
var ErrProfileNotFound = errors.New("profile not found")

// more errors can be added here as needed