package postgres

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

func AddWorkoutIndex(db *gorm.DB, concurrently bool) error {
	cc := ""
	if concurrently {
		cc = " CONCURRENTLY"
	}

	stmts := []string{
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workout_plans_user_id_id
			ON workout_plans (user_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workout_cycles_plan_id_id
			ON workout_cycles (workout_plan_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workouts_cycle_id_id
			ON workouts (workout_cycle_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workout_exercises_workout_id_id
			ON workout_exercises (workout_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workout_sets_we_id_id
			ON workout_sets (workout_exercise_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workouts_cycle_completed_false
			ON workouts (workout_cycle_id)
			WHERE completed = FALSE`, cc),
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_workouts_cycle_skipped_true
			ON workouts (workout_cycle_id)
			WHERE skipped = TRUE`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_we_workout_completed_false
			ON workout_exercises (workout_id)
			WHERE completed = FALSE`, cc),
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_we_workout_skipped_true
			ON workout_exercises (workout_id)
			WHERE skipped = TRUE`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_sets_we_completed_false
			ON workout_sets (workout_exercise_id)
			WHERE completed = FALSE`, cc),
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_sets_we_skipped_true
			ON workout_sets (workout_exercise_id)
			WHERE skipped = TRUE`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_sets_we_has_values
			ON workout_sets (workout_exercise_id)
			WHERE reps IS NOT NULL AND weight IS NOT NULL`, cc),
	}

	for _, raw := range stmts {
		sql := strings.Join(strings.Fields(raw), " ")
		if err := db.Exec(sql).Error; err != nil {
			return err
		}
	}
	return nil
}

func AddUserIndexes(db *gorm.DB, concurrently bool) error {
	cc := ""
	if concurrently {
		cc = " CONCURRENTLY"
	}

	stmts := []string{
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_users_verified_id
			ON users (is_verified, id)`, cc),
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_users_last_seen_id
			ON users (last_seen_at, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_profiles_user_id_id
			ON profiles (user_id, id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_settings_beta_true
			ON user_settings (user_id)
			WHERE beta_opt_in = TRUE`, cc),
		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_settings_email_notif_true
			ON user_settings (user_id)
			WHERE email_notifications = TRUE`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_consents_user_created
			ON user_consents (user_id, created_at)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_consents_user_given_true
			ON user_consents (user_id)
			WHERE given = TRUE`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_consents_type
			ON user_consents (type)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_user_roles_role_id_user_id
			ON user_roles (role_id, user_id)`, cc),

		fmt.Sprintf(`CREATE INDEX%s IF NOT EXISTS idx_role_permissions_permission_id_role_id
			ON role_permissions (permission_id, role_id)`, cc),
	}

	for _, raw := range stmts {
		sql := strings.Join(strings.Fields(raw), " ")
		if err := db.Exec(sql).Error; err != nil {
			return err
		}
	}
	return nil
}
