import {ChartUpIcon, ChartDownIcon, ChartEqualIcon} from '../icons/ChartIcon';

export function getExerciseProgressBadge(set) {
  if (!set.completed) return null;

  const prevReps = set.previous_reps ?? 0;
  const prevWeight = set.previous_weight ?? 0;

  const currReps = set.reps ?? 0;
  const currWeight = set.weight ?? 0;

  const prevVolume = prevReps * prevWeight;
  const currVolume = currReps * currWeight;

  if (currVolume > prevVolume) {
    return <ChartUpIcon />;
  } else if (currVolume < prevVolume) {
    return <ChartDownIcon />;
  } else {
    return <ChartEqualIcon />;
  }
}
