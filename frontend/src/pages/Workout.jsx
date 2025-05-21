import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const Workout = () => {
    const { id } = useParams();
    const [workout, setWorkout] = useState(null);
    const [exercises, setExercises] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/workouts/${id}`)
            .then((response) => {
                setWorkout(response.data);
                setExercises(response.data.exercises);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching workout:", error);
                setError(error);
                setLoading(false);
            });
    }, [id]);

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
            {exercises && (
                <ul>
                    {exercises.map((exercise) => (
                        <li key={exercise.id}>
                            <h2 className="text-xl font-semibold mb-2">{exercise.name}</h2>
                            <p className="mb-4">Muscle: {exercise.muscle}</p>
                            <p className="mb-4">Weight: {exercise.weight}</p>
                            <p className="mb-4">Reps: {exercise.reps}</p>
                            <p className="mb-4">Sets: {exercise.sets}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        </>
    );
}

export default Workout;