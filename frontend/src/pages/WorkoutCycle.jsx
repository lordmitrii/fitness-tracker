import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

const WorkoutCycle = () => {
    const { planID, cycleID } = useParams();
    const [workouts, setWorkouts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`workout-plans/${planID}/workout-cycles/${cycleID}`)
            .then((response) => {
                setWorkouts(response.data.workouts);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching workout cycle:", error);
                setError(error);
                setLoading(false);
            });
    }, [planID, cycleID]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error.message}</p>;
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Workout Cycle</h1>
            {workouts && (
                <ul>
                    {workouts.map((workout) => (
                        <li key={workout.id}>
                            <Link className="text-2xl mb-4" to={`/workout-plans/${planID}/workout-cycles/${cycleID}/workouts/${workout.id}`}>Title: {workout.name}</Link>
                            <p className="mb-4">Created at: {workout.created_at}</p>
                        </li>
                    ))}
                </ul>   
            )}
        </div>
    );
}

export default WorkoutCycle;