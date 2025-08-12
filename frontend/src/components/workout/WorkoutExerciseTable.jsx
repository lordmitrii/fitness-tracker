import { memo, useMemo } from "react";
import ExerciseRow from "./WorkoutExerciseRow";

const WorkoutExerciseTable = (props) => {
  const { exercises } = props;

  const sortedExercises = useMemo(
    () => (exercises || []).slice().sort((a, b) => a.index - b.index),
    [exercises]
  );

  return (
    <div className="flex flex-col gap-6 sm:p-4 rounded-lg shadow-md">
      {sortedExercises.map((ex) => (
        <ExerciseRow
          key={ex.id}
          {...props}
          exercise={ex}
          allExercises={sortedExercises}
        />
      ))}
    </div>
  );
};

export default memo(WorkoutExerciseTable);
