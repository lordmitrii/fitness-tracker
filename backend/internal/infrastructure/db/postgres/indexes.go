package postgres

import (
	"fmt"

	"gorm.io/gorm"
)

func AddPostgresIndexes(db *gorm.DB, concurrently bool) error {
	cc := ""
	if concurrently {
		cc = "CONCURRENTLY "
	}

	stmts := []string{
		`CREATE INDEX IF NOT EXISTS idx_wp_user_id ON workout_plans USING btree (user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_wp_id_user_id ON workout_plans USING btree (id, user_id);`,

		`CREATE INDEX IF NOT EXISTS idx_wc_plan_id ON workout_cycles USING btree (workout_plan_id);`,
		`CREATE INDEX IF NOT EXISTS idx_wc_prev_id ON workout_cycles USING btree (previous_cycle_id);`,
		`CREATE INDEX IF NOT EXISTS idx_wc_next_id ON workout_cycles USING btree (next_cycle_id);`,

		`CREATE INDEX IF NOT EXISTS idx_w_cycle_id ON workouts USING btree (workout_cycle_id);`,
		`CREATE INDEX IF NOT EXISTS idx_w_cycle_index ON workouts USING btree (workout_cycle_id, index);`,

		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_w_cycle_completed_false ON workouts USING btree (workout_cycle_id) WHERE completed = FALSE;`, cc),
		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_w_cycle_skipped_true   ON workouts USING btree (workout_cycle_id) WHERE skipped   = TRUE;`, cc),

		`CREATE INDEX IF NOT EXISTS idx_we_workout_id ON workout_exercises USING btree (workout_id);`,
		`CREATE INDEX IF NOT EXISTS idx_we_workout_index ON workout_exercises USING btree (workout_id, index);`,
		`CREATE INDEX IF NOT EXISTS idx_we_individual_exercise_id ON workout_exercises USING btree (individual_exercise_id);`,
		`CREATE INDEX IF NOT EXISTS idx_we_prev_id ON workout_exercises USING btree (previous_exercise_id);`,

		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_we_workout_completed_false ON workout_exercises USING btree (workout_id) WHERE completed = FALSE;`, cc),
		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_we_workout_skipped_true   ON workout_exercises USING btree (workout_id) WHERE skipped   = TRUE;`, cc),

		`CREATE INDEX IF NOT EXISTS idx_ws_we_id ON workout_sets USING btree (workout_exercise_id);`,
		`CREATE INDEX IF NOT EXISTS idx_ws_we_index ON workout_sets USING btree (workout_exercise_id, index);`,

		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_ws_we_completed_false ON workout_sets USING btree (workout_exercise_id) WHERE completed = FALSE;`, cc),
		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_ws_we_skipped_true   ON workout_sets USING btree (workout_exercise_id) WHERE skipped   = TRUE;`, cc),
		fmt.Sprintf(`CREATE INDEX %sIF NOT EXISTS idx_ws_we_reps_weight_present ON workout_sets USING btree (workout_exercise_id) WHERE reps IS NOT NULL AND weight IS NOT NULL;`, cc),
	}

	for _, s := range stmts {
		if err := db.Exec(s).Error; err != nil {
			return err
		}
	}
	return nil
}
