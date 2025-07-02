const WorkoutExerciseTable = ({ workout }) => {
  return (
    <table className="min-w-full bg-gray-50 rounded-xl">
      <thead>
        <tr>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
            Exercise
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
            Sets
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
            Reps
          </th>
          <th className="py-2 px-4 text-left font-semibold text-gray-700 border-b w-1/4">
            Weight
          </th>
        </tr>
      </thead>
      <tbody>
        {workout.workout_exercises
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((ex, idx) => (
            <tr
              key={ex.id}
              className={
                idx % 2 === 0
                  ? "bg-white border-b last:border-0"
                  : "bg-gray-100 border-b last:border-0"
              }
            >
              <td className="py-2 px-4">{ex.exercise.name}</td>
              <td className="py-2 px-4">{ex.sets}</td>
              <td className="py-2 px-4">{ex.reps}</td>
              <td className="py-2 px-4">{ex.weight} kg</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default WorkoutExerciseTable;