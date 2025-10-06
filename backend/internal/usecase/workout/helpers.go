package workout

import (
	"math"

	"github.com/lordmitrii/golang-web-gin/internal/domain/user"
	"github.com/lordmitrii/golang-web-gin/internal/domain/workout"
)

func toAnySlice[T any](xs []T) []any {
	out := make([]any, len(xs))
	for i, v := range xs {
		out[i] = v
	}
	return out
}

// MET - Metabolic Equivalent of Task

const (
	secPerRepDefault  = 3.0 // seconds per rep when not known
	restSecResistance = 105.0 // 1 min 45 sec for resistance training
	restSecTimeBased  =  60.0 // 1 min for time-based exercises
	minSetActiveSec   = 15.0 // minimum active seconds per set
	restMET = 1.8 // MET value for rest
	overheadFactor = 1.1 // to account for other activities like transitions, waiting, etc.
	epoc = 1.2 // excess post-exercise oxygen consumption
)

func (s *workoutServiceImpl) estimateExerciseEnergy(
	ie *workout.IndividualExercise,
	we *workout.WorkoutExercise,
	userWeightKg float64,
) (calories, avgMET, activeMin, restMin float64) {
	if we == nil || ie == nil || len(we.WorkoutSets) == 0 {
		return 0, 0, 0, 0
	}

	isTimeBased := ie.IsTimeBased
	isBodyweight := ie.IsBodyweight 

	var (
		activeSec   float64
		restSec     float64
		totalSets   int
		metSum      float64
		totalForMet int
	)

	for _, set := range we.WorkoutSets {
		if set == nil {
			continue
		}
		totalSets++

		reps := 0
		if set.Reps != nil {
			reps = *set.Reps
		}
		weightKg := 0.0
		if set.Weight != nil {
			w := max(*set.Weight, 0)
			weightKg = float64(w) / 1000.0
		}

		if isTimeBased {
			sec := float64(reps)
			if sec <= 0 {
				sec = minSetActiveSec
			}
			activeSec += sec
		} else {
			if reps > 0 {
				activeSec += float64(reps) * secPerRepDefault
			} else {
				activeSec += minSetActiveSec
			}
		}

		perSetMET := estimateSetMET(isTimeBased, isBodyweight, reps, weightKg, userWeightKg)
		metSum += perSetMET
		totalForMet++
	}

	if totalSets > 0 {
		r := restSecResistance
		if isTimeBased {
			r = restSecTimeBased
		}
		if totalSets >= 1 {
			restSec += float64(totalSets) * r
		}
	}

	if totalForMet == 0 {
		avgMET = 4.5
	} else {
		avgMET = metSum / float64(totalForMet)
		if avgMET < 3.0 {
			avgMET = 3.0
		}
		if avgMET > 9.0 {
			avgMET = 9.0
		}
	}

	activeMin = activeSec / 60.0
	restMin = restSec / 60.0

	calories = 0.0175*avgMET*userWeightKg*activeMin + 0.0175*restMET*userWeightKg*restMin
	calories *= overheadFactor 
	calories *= epoc
	calories = math.Round(calories*10) / 10.0

	return calories, avgMET, activeMin, restMin
}


func estimateSetMET(isTimeBased, isBodyweight bool, reps int, weightKg, userWeightKg float64) float64 {
	if isTimeBased {
		if reps >= 45 {
			return 6.0
		}
		if reps >= 20 {
			return 5.5
		}
		return 5.0
	}

	ratio := 0.0
	if userWeightKg > 0 {
		ratio = weightKg / userWeightKg
	}
	base := 4.0
	switch {
	case ratio < 0.3:
		base = 4.0
	case ratio < 0.6:
		base = 5.0
	default:
		base = 6.0
	}

	if reps >= 12 {
		base += 0.5
	}
	if base < 3.0 {
		base = 3.0
	}
	if base > 9.0 {
		base = 9.0
	}
	return base
}

func adjustCaloriesForUser(cal float64, age int, sex string) float64 {
	if age > 0 {
		switch {
		case age < 25:
			cal *= 1.05
		case age > 50:
			cal *= 0.90
		}
	}
	switch sex {
	case user.SexMale:
		cal *= 1.05
	case user.SexFemale:
		cal *= 0.95
	}
	return cal
}
