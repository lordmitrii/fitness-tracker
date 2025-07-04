export function getExerciseProgressBadge(exercise) {
  if (!exercise.completed) return null;

  const prevSets = exercise.previous_sets ?? 0;
  const prevReps = exercise.previous_reps ?? 0;
  const prevWeight = exercise.previous_weight ?? 0;

  const currSets = exercise.sets ?? 0;
  const currReps = exercise.reps ?? 0;
  const currWeight = exercise.weight ?? 0;

  const prevVolume = prevSets * prevReps * prevWeight;
  const currVolume = currSets * currReps * currWeight;

  if (currVolume > prevVolume) {
    return (
      <span className="text-green-600 font-semibold">Good</span>
    );
  } else if (currVolume < prevVolume) {
    return (
      <span className="text-red-600 font-semibold">Bad</span>
    );
  } else {
    return (
      <span className="text-yellow-600 font-semibold">Same</span>
    );
  }
}
