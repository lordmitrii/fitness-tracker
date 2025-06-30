import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { CreateProfileForm, UpdateProfileForm } from "./pages/ProfileForm";
import { CreateWorkoutPlanForm, UpdateWorkoutPlanForm } from "./pages/WorkoutPlanForm";
import { CreateWorkoutForm, UpdateWorkoutForm } from "./pages/WorkoutForm";
import WorkoutPlans from "./pages/WorkoutPlans";
import WorkoutPlanSingle from "./pages/WorkoutPlanSingle";
import Workout from "./pages/Workout";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />

            {/* Private Route */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-profile" element={<CreateProfileForm />} />
              <Route path="/update-profile" element={<UpdateProfileForm />} />

              <Route path="/workout-plans" element={<WorkoutPlans />} />
              <Route path="/create-workout-plan" element={<CreateWorkoutPlanForm />} />
              <Route path="/update-workout-plan/:planID" element={<UpdateWorkoutPlanForm />} />

              <Route path="/workout-plans/:planID/workout-cycles/:cycleID" element={<WorkoutPlanSingle />} />
              <Route path="/workout-plans/:planID/workout-cycles/:cycleID/create-workout" element={<CreateWorkoutForm />} />
              <Route path="/workout-plans/:planID/workout-cycles/:cycleID/update-workout/:workoutID" element={<UpdateWorkoutForm />} />

              <Route path="/workout-plans/:planID/workout-cycles/:cycleID/workouts/:workoutID" element={<Workout />} />

            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
