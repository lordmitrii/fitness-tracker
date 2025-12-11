package workout

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/lordmitrii/golang-web-gin/internal/domain/shared/domainevt"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
	"github.com/lordmitrii/golang-web-gin/internal/infrastructure/uow"
)

type accumulatorCtxKey struct{}

func withEventAccumulator(ctx context.Context, acc *uow.EventAccumulator) context.Context {
	return context.WithValue(ctx, accumulatorCtxKey{}, acc)
}

func addEventsToAccumulator(ctx context.Context, evs []domainevt.Event) {
	if len(evs) == 0 {
		return
	}
	acc, ok := ctx.Value(accumulatorCtxKey{}).(*uow.EventAccumulator)
	if !ok || acc == nil {
		return
	}
	acc.Add(toAnySlice(evs)...)
}

type completionHandler struct {
	dispatcher   *domainevt.Dispatcher
	setRepo      workout.WorkoutSetRepository
	exerciseRepo workout.WorkoutExerciseRepository
	workoutRepo  workout.WorkoutRepository
	cycleRepo    workout.WorkoutCycleRepository
}

func registerCompletionHandlers(s *workoutServiceImpl) {
	h := &completionHandler{
		dispatcher:   s.dispatcher,
		setRepo:      s.workoutSetRepo,
		exerciseRepo: s.workoutExerciseRepo,
		workoutRepo:  s.workoutRepo,
		cycleRepo:    s.workoutCycleRepo,
	}

	s.dispatcher.Register(workout.WorkoutSetStatusChanged{}.EventType(), h.onWorkoutSetStatusChanged)
	s.dispatcher.Register(workout.WorkoutExerciseStatusChanged{}.EventType(), h.onWorkoutExerciseStatusChanged)
	s.dispatcher.Register(workout.WorkoutStatusChanged{}.EventType(), h.onWorkoutStatusChanged)
	s.dispatcher.Register(workout.WorkoutCycleStatusChanged{}.EventType(), h.onWorkoutCycleStatusChanged)
}

func (h *completionHandler) onWorkoutSetStatusChanged(ctx context.Context, e domainevt.Event) error {
	ev := e.(workout.WorkoutSetStatusChanged)

	pendingSets, err := h.setRepo.GetPendingSetsCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID, ev.WorkoutExerciseID)
	if err != nil {
		return err
	}
	skippedSets, err := h.setRepo.GetSkippedSetsCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID, ev.WorkoutExerciseID)
	if err != nil {
		return err
	}
	totalSets, err := h.setRepo.GetTotalSetsCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID, ev.WorkoutExerciseID)
	if err != nil {
		return err
	}

	exCompleted, exSkipped := resolveCompletion(totalSets, pendingSets, skippedSets)

	if _, err := h.exerciseRepo.UpdateReturning(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID, ev.WorkoutExerciseID, map[string]any{
		"completed": exCompleted,
		"skipped":   exSkipped,
	}); err != nil {
		return err
	}

	return h.dispatcher.Dispatch(ctx, []domainevt.Event{
		workout.WorkoutExerciseStatusChanged{
			EventID:           uuid.NewString(),
			UserID:            ev.UserID,
			PlanID:            ev.PlanID,
			CycleID:           ev.CycleID,
			WorkoutID:         ev.WorkoutID,
			WorkoutExerciseID: ev.WorkoutExerciseID,
			Completed:         exCompleted,
			Skipped:           exSkipped,
			At:                ev.At,
		},
	})
}

func (h *completionHandler) onWorkoutExerciseStatusChanged(ctx context.Context, e domainevt.Event) error {
	ev := e.(workout.WorkoutExerciseStatusChanged)

	pendingExercises, err := h.exerciseRepo.GetPendingExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}
	skippedExercises, err := h.exerciseRepo.GetSkippedExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}
	totalExercises, err := h.exerciseRepo.GetTotalExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}

	wCompleted, wSkipped := resolveCompletion(totalExercises, pendingExercises, skippedExercises)

	return h.dispatcher.Dispatch(ctx, []domainevt.Event{
		workout.WorkoutStatusChanged{
			EventID:   uuid.NewString(),
			UserID:    ev.UserID,
			PlanID:    ev.PlanID,
			CycleID:   ev.CycleID,
			WorkoutID: ev.WorkoutID,
			Completed: wCompleted,
			Skipped:   wSkipped,
			At:        ev.At,
		},
	})
}

func (h *completionHandler) onWorkoutStatusChanged(ctx context.Context, e domainevt.Event) error {
	ev := e.(workout.WorkoutStatusChanged)
	now := ev.At
	if now.IsZero() {
		now = time.Now()
	}

	pendingExercises, err := h.exerciseRepo.GetPendingExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}
	skippedExercises, err := h.exerciseRepo.GetSkippedExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}
	totalExercises, err := h.exerciseRepo.GetTotalExercisesCount(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}

	wCompleted, wSkipped := resolveCompletion(totalExercises, pendingExercises, skippedExercises)

	wk, err := h.workoutRepo.GetByID(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID)
	if err != nil {
		return err
	}

	switch {
	case wCompleted:
		wk.Complete(now, ev.UserID)
	case wSkipped:
		wk.Completed = false
		wk.Skipped = true
	default:
		wk.Completed = false
		wk.Skipped = false
	}

	if err := h.workoutRepo.Update(ctx, ev.UserID, ev.PlanID, ev.CycleID, ev.WorkoutID, map[string]any{
		"completed": wk.Completed,
		"skipped":   wk.Skipped,
	}); err != nil {
		return err
	}

	events := wk.PendingEvents()
	addEventsToAccumulator(ctx, events)
	if err := h.dispatcher.Dispatch(ctx, events); err != nil {
		return err
	}
	wk.ClearPendingEvents()

	return h.dispatcher.Dispatch(ctx, []domainevt.Event{
		workout.WorkoutCycleStatusChanged{
			EventID:   uuid.NewString(),
			UserID:    ev.UserID,
			PlanID:    ev.PlanID,
			CycleID:   ev.CycleID,
			Completed: wCompleted,
			Skipped:   wSkipped,
			At:        now,
		},
	})
}

func (h *completionHandler) onWorkoutCycleStatusChanged(ctx context.Context, e domainevt.Event) error {
	ev := e.(workout.WorkoutCycleStatusChanged)

	workouts, err := h.workoutRepo.GetByWorkoutCycleID(ctx, ev.UserID, ev.PlanID, ev.CycleID)
	if err != nil {
		return err
	}

	totalWorkouts := len(workouts)
	if totalWorkouts == 0 {
		return nil
	}

	incomplete, err := h.workoutRepo.GetIncompleteWorkoutsCount(ctx, ev.UserID, ev.PlanID, ev.CycleID)
	if err != nil {
		return err
	}
	skipped, err := h.workoutRepo.GetSkippedWorkoutsCount(ctx, ev.UserID, ev.PlanID, ev.CycleID)
	if err != nil {
		return err
	}

	cCompleted, cSkipped := resolveCompletion(int64(totalWorkouts), incomplete, skipped)

	_, err = h.cycleRepo.UpdateReturning(ctx, ev.UserID, ev.PlanID, ev.CycleID, map[string]any{
		"completed": cCompleted,
		"skipped":   cSkipped,
	})
	return err
}

func resolveCompletion(total, pending, skipped int64) (completed, skippedAll bool) {
	if total == 0 {
		return false, false
	}
	completed = pending == 0
	skippedAll = completed && skipped == total
	return
}
