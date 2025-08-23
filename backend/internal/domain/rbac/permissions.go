package rbac

const (
	PermAdmin              = "admin"
	PermTester             = "tester"
	PermWorkoutReadSelf    = "workout:read:self"
	PermWorkoutWriteSelf   = "workout:write:self"
	PermWorkoutWriteOthers = "workout:write:others"
	PermWorkoutReadOthers  = "workout:read:others"
	PermUserReadSelf       = "user:read:self"
	PermUserWriteSelf      = "user:write:self"
	PermUserReadOthers     = "user:read:others"
	PermUserWriteOthers    = "user:write:others"
	PermAiQuestions        = "ai:questions"
)

type Permission struct {
	ID  uint   `gorm:"primaryKey"`
	Key string `gorm:"not null;uniqueIndex:idx_permission_key"`
}

type RolePermission struct {
	RoleID       uint `gorm:"primaryKey"`
	PermissionID uint `gorm:"primaryKey"`
}
