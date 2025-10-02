package postgres

import (
	"gorm.io/gorm"
)

func SubqPlans(db *gorm.DB, userId uint, planId *uint) *gorm.DB {
	q := db.Table("workout_plans AS wp").
		Select("wp.id").
		Where("wp.user_id = ?", userId)
	if planId != nil {
		q = q.Where("wp.id = ?", *planId)
	}
	return q
}

func SubqCycles(db *gorm.DB, userId, planId uint, cycleId *uint) *gorm.DB {
	q := db.Table("workout_cycles AS wc").
		Select("wc.id").
		Joins("JOIN workout_plans AS wp ON wp.id = wc.workout_plan_id").
		Where("wc.workout_plan_id = ? AND wp.user_id = ?", planId, userId)
	if cycleId != nil {
		q = q.Where("wc.id = ?", *cycleId)
	}
	return q
}

func SubqWorkouts(db *gorm.DB, userId, planId, cycleId uint, workoutId *uint) *gorm.DB {
	q := db.Table("workouts AS w").
		Select("w.id").
		Joins("JOIN workout_cycles AS wc ON wc.id = w.workout_cycle_id").
		Joins("JOIN workout_plans  AS wp ON wp.id = wc.workout_plan_id").
		Where("w.workout_cycle_id = ? AND wc.workout_plan_id = ? AND wp.user_id = ?", cycleId, planId, userId)
	if workoutId != nil {
		q = q.Where("w.id = ?", *workoutId)
	}
	return q
}

func SubqWorkoutExercises(db *gorm.DB, userId, planId, cycleId, workoutId uint, weId *uint) *gorm.DB {
	q := db.Table("workout_exercises AS we").
		Select("we.id").
		Joins("JOIN workouts       AS w  ON w.id  = we.workout_id").
		Joins("JOIN workout_cycles AS wc ON wc.id = w.workout_cycle_id").
		Joins("JOIN workout_plans  AS wp ON wp.id = wc.workout_plan_id").
		Where(`
			we.workout_id = ? AND
			w.workout_cycle_id = ? AND
			wc.workout_plan_id = ? AND
			wp.user_id = ?`,
			workoutId, cycleId, planId, userId)
	if weId != nil {
		q = q.Where("we.id = ?", *weId)
	}
	return q
}

func SubqWorkoutSets(db *gorm.DB, userId, planId, cycleId, workoutId, weId uint, setId *uint) *gorm.DB {
	q := db.Table("workout_sets AS ws").
		Select("ws.id").
		Joins("JOIN workout_exercises AS we ON we.id = ws.workout_exercise_id").
		Joins("JOIN workouts          AS w  ON w.id  = we.workout_id").
		Joins("JOIN workout_cycles    AS wc ON wc.id = w.workout_cycle_id").
		Joins("JOIN workout_plans     AS wp ON wp.id = wc.workout_plan_id").
		Where(`
			ws.workout_exercise_id = ? AND
			we.workout_id = ? AND
			w.workout_cycle_id = ? AND
			wc.workout_plan_id = ? AND
			wp.user_id = ?`,
			weId, workoutId, cycleId, planId, userId)
	if setId != nil {
		q = q.Where("ws.id = ?", *setId)
	}
	return q
}

func PreloadCycleFull(db *gorm.DB) *gorm.DB {
	return db.Preload("Workouts", func(db *gorm.DB) *gorm.DB {
		return db.Order("index ASC").Order("id ASC").
			Preload("WorkoutExercises.IndividualExercise.MuscleGroup").
			Preload("WorkoutExercises.IndividualExercise.Exercise").
			Preload("WorkoutExercises.WorkoutSets")
	})
}

func PreloadWorkoutFull(db *gorm.DB) *gorm.DB {
	return db.Preload("WorkoutExercises.IndividualExercise").
		Preload("WorkoutExercises.WorkoutSets")
}

func PreloadWorkoutExerciseFull(db *gorm.DB) *gorm.DB {
	return db.Preload("WorkoutSets").
		Preload("IndividualExercise.MuscleGroup").
		Preload("IndividualExercise.Exercise")
}
