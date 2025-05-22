import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const Workout = () => {
    const { planID, cycleID, workoutID } = useParams();
    const [workout, setWorkout] = useState(null);
    const [workoutExercises, setWorkoutExercises] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workoutID}`)
            .then((response) => {
                setWorkout(response.data);
                setWorkoutExercises(response.data.workout_exercises);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching workout:", error);
                setError(error);
                setLoading(false);
            });
    }, [planID, cycleID, workoutID]);

    if (loading) {
        return <p>Loading...</p>;
    }
    if (error) {
        return <p>Error: {error.message}</p>;
    }

    return (
        <>
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Workout {workout.name}</h1>
        </div>
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Exercises:</h1>
            {workoutExercises && (
                <ul>
                    {workoutExercises.map((workoutExercise) => (
                        <li key={workoutExercise.id}>
                            <h2 className="text-xl font-semibold mb-2">{workoutExercise.exercise?.name}</h2>
                            <p className="mb-4">Muscle: {workoutExercise.exercise?.muscle_group}</p>
                            <p className="mb-4">Weight: {workoutExercise.weight}</p>
                            <p className="mb-4">Reps: {workoutExercise.reps}</p>
                            <p className="mb-4">Sets: {workoutExercise.sets}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        </>
    );
}

export default Workout;