package errors

import (
	"errors"
)

var ErrNotFound = errors.New("data not found")
var ErrUserNotFound = errors.New("user not found")
var ErrProfileNotFound = errors.New("profile not found")
var ErrIndividualExerciseNotFound = errors.New("plan exercise not found")
var ErrNoConsent = errors.New("no consent provided")
var ErrTranslationNotFound = errors.New("translation not found")

// more errors can be added here as needed