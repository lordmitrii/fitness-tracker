package postgres

import (
	"fmt"

	"github.com/lordmitrii/golang-web-gin/internal/domain/rbac"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedRBAC(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		permKeys := []string{
			rbac.PermAdmin,
			rbac.PermTester,
			rbac.PermUserReadSelf,
			rbac.PermUserWriteSelf,
			rbac.PermUserReadOthers,
			rbac.PermUserWriteOthers,
			rbac.PermWorkoutReadSelf,
			rbac.PermWorkoutWriteSelf,
			rbac.PermWorkoutReadOthers,
			rbac.PermWorkoutWriteOthers,
			rbac.PermAiQuestions,
		}
		for _, key := range permKeys {
			if err := tx.
				Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "key"}}, DoNothing: true}).
				Create(&rbac.Permission{Key: key}).Error; err != nil {
				return err
			}
		}

		var perms []rbac.Permission
		if err := tx.Where("key IN ?", permKeys).Find(&perms).Error; err != nil {
			return err
		}
		keyToID := make(map[string]uint, len(perms))
		for _, p := range perms {
			keyToID[p.Key] = p.ID
		}

		rolePerms := map[string][]string{
			rbac.RoleAdmin: {
				rbac.PermAdmin,
				rbac.PermUserReadSelf, rbac.PermUserWriteSelf,
				rbac.PermWorkoutReadSelf, rbac.PermWorkoutWriteSelf,
				rbac.PermUserReadOthers, rbac.PermUserWriteOthers,
				rbac.PermWorkoutReadOthers, rbac.PermWorkoutWriteOthers,
				rbac.PermAiQuestions,
			},
			rbac.RoleTester: {
				rbac.PermTester,
			},
			rbac.RoleMember: {
				rbac.PermUserReadSelf, rbac.PermUserWriteSelf,
				rbac.PermWorkoutReadSelf, rbac.PermWorkoutWriteSelf,
				rbac.PermAiQuestions,
			},
			rbac.RoleVerified: {
				rbac.PermUserReadSelf, rbac.PermUserWriteSelf,
				rbac.PermWorkoutReadSelf, rbac.PermWorkoutWriteSelf,
			},
			rbac.RoleRestricted: {
				rbac.PermUserReadSelf, rbac.PermWorkoutReadSelf,
			},
		}

		for roleName, keys := range rolePerms {
			role := rbac.Role{Name: roleName}
			if err := tx.
				Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "name"}}, DoNothing: true}).
				Create(&role).Error; err != nil {
				return err
			}

			if role.ID == 0 {
				if err := tx.Where("name = ?", roleName).First(&role).Error; err != nil {
					return err
				}
			}

			for _, k := range keys {
				pid, ok := keyToID[k]
				if !ok {
					return fmt.Errorf("permission key not found after seed: %s", k)
				}
				if err := tx.
					Clauses(clause.OnConflict{DoNothing: true}).
					Create(&rbac.RolePermission{RoleID: role.ID, PermissionID: pid}).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}
