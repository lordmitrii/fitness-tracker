import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Layout from "./layout/Layout";

import Home from "./pages/Home";

import WorkoutPlans from "./pages/workout/WorkoutPlans";
import WorkoutPlanSingle from "./pages/workout/WorkoutPlanSingle";

import ExerciseStats from "./pages/ExerciseStats";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import Admin from "./pages/admin/Admin";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Audit from "./pages/admin/Audit";
import ExercisesAndMuscles from "./pages/admin/ExercisesAndMuscles";

import AIChat from "./pages/AIChat";
import InstallationGuide from "./pages/InstallationGuide";

import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import HealthDataPolicy from "./pages/policies/HealthDataPolicy";

import LoginForm from "./forms/login/LoginForm";
import RegisterForm from "./forms/login/RegisterForm";
import ForgotPassword from "./forms/login/ForgotPassword";
import ResetPassword from "./forms/login/ResetPassword";

import {
  CreateProfileForm,
  UpdateProfileForm,
} from "./forms/profile/ProfileForm";

import AddWorkoutPlanForm from "./forms/workout/AddWorkoutPlanForm";
import UpdateWorkoutPlanForm from "./forms/workout/UpdateWorkoutPlanForm";
import {
  CreateWorkoutForm,
  UpdateWorkoutForm,
} from "./forms/workout/WorkoutForm";

import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";

import "./i18n";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/installation-guide" element={<InstallationGuide />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/health-data-policy" element={<HealthDataPolicy />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Private Route */}
            <Route element={<PrivateRoute />}>
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-profile" element={<CreateProfileForm />} />
              <Route path="/update-profile" element={<UpdateProfileForm />} />

              <Route path="/exercise-stats" element={<ExerciseStats />} />

              <Route path="/workout-plans" element={<WorkoutPlans />} />
              <Route
                path="/create-workout-plan"
                element={<AddWorkoutPlanForm />}
              />
              <Route
                path="/update-workout-plan/:planID"
                element={<UpdateWorkoutPlanForm />}
              />

              <Route
                path="/workout-plans/:planID/workout-cycles/:cycleID"
                element={<WorkoutPlanSingle />}
              />
              <Route
                path="/workout-plans/:planID/workout-cycles/:cycleID/create-workout"
                element={<CreateWorkoutForm />}
              />
              <Route
                path="/workout-plans/:planID/workout-cycles/:cycleID/update-workout/:workoutID"
                element={<UpdateWorkoutForm />}
              />

              <Route element={<AdminRoute />}>
                <Route path="/admin-panel/*" element={<Admin />}>
                  <Route
                    index
                    element={<Navigate to="users?footer=false" replace />}
                  />
                  <Route path="users" element={<Users />} />
                  <Route path="roles" element={<Roles />} />
                  <Route path="audit" element={<Audit />} />
                  <Route
                    path="exercises-and-muscles"
                    element={<ExercisesAndMuscles />}
                  />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
