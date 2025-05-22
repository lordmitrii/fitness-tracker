import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';


const WorkoutPlanSingle = () => {
    const { planID } = useParams();
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [workoutCycles, setWorkoutCycles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useState(() => {
        api.get(`/workout-plans/${planID}`)
            .then((response) => {
                setWorkoutPlan(response.data);
                setWorkoutCycles(response.data.workout_cycles);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching workout plan:", error);
                setError(error);
                setLoading(false);
            });
    }, [planID]); 

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error.message}</p>;
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Workout Plan</h1>
            {workoutPlan && (
                <>
                <div>
                    <h2 className="text-xl font-semibold mb-2">{workoutPlan.name}</h2>
                    <p className="mb-4">Created at: {workoutPlan.created_at}</p>
                </div>
                {workoutCycles.map((cycle) => (
                    <div key={cycle.id} className="mb-4">
                        <Link className="text-lg font-semibold" to={`/workout-plans/${planID}/workout-cycles/${cycle.id}`}>{cycle.name}</Link>
                    </div>
                ))}
                </>
            )}
        </div>
    )
}

export default WorkoutPlanSingle;