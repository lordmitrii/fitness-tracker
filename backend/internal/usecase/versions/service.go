package versions

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/versions"
	"github.com/lordmitrii/golang-web-gin/internal/usecase"
)

type versionsServiceImpl struct {
	versionsRepo versions.VersionRepository
}

func NewVersionsService(
	vr versions.VersionRepository,
) usecase.VersionsService {
	return &versionsServiceImpl{
		versionsRepo: vr,
	}
}
