import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useState } from "react";

import Layout from "./layout/Layout";

import Home from "./pages/Home";

import WorkoutPlans from "./pages/workout/WorkoutPlans";
import WorkoutCycle from "./pages/workout/WorkoutCycle";

import Profile from "./pages/profile/Profile";
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
import Health from "./pages/profile/Health";
import Stats from "./pages/profile/Stats";

import CreateWorkoutPlanForm from "./forms/workout/CreateWorkoutPlanForm";
import UpdateWorkoutPlanForm from "./forms/workout/UpdateWorkoutPlanForm";
import {
  CreateWorkoutForm,
  UpdateWorkoutForm,
} from "./forms/workout/WorkoutForm";

import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";
import WorkoutRedirect from "./routes/WorkoutRedirect";

import "./i18n";

import { ErrorBoundary } from "./diagnostics/ErrorBoundary";
import LogPanel from "./diagnostics/LogPanel";
import { useLongPressToggle } from "./hooks/useLongPressToggle";
import TouchHotspot from "./components/TouchHotspot";

function App() {
  const [showLogs, setShowLogs] = useState(false);
  useLongPressToggle(() => setShowLogs((prev) => !prev));

  return (
    <ErrorBoundary
      onError={(e, info) => console.error(e, info)}
      // onRetry={() => {}}
    >
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/installation-guide"
                element={<InstallationGuide />}
              />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route
                path="/health-data-policy"
                element={<HealthDataPolicy />}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Private Route */}
              <Route element={<PrivateRoute />}>
                <Route path="/ai-chat" element={<AIChat />} />

                {/* Workout Routes */}
                <Route path="/current-workout" element={<WorkoutRedirect />} />
                <Route path="/workout-plans" element={<WorkoutPlans />} />
                <Route
                  path="/create-workout-plan"
                  element={<CreateWorkoutPlanForm />}
                />
                <Route
                  path="/update-workout-plan/:planID"
                  element={<UpdateWorkoutPlanForm />}
                />

                <Route
                  path="/workout-plans/:planID/workout-cycles/:cycleID"
                  element={<WorkoutCycle />}
                />
                <Route
                  path="/workout-plans/:planID/workout-cycles/:cycleID/create-workout"
                  element={<CreateWorkoutForm />}
                />
                <Route
                  path="/workout-plans/:planID/workout-cycles/:cycleID/update-workout/:workoutID"
                  element={<UpdateWorkoutForm />}
                />

                {/* Profile Routes */}
                <Route path="/profile/*" element={<Profile />}>
                  <Route index element={<Navigate to="health" replace />} />
                  <Route path="health" element={<Health />} />
                  <Route path="stats" element={<Stats />} />
                  <Route
                    path="health/create-profile"
                    element={<CreateProfileForm />}
                  />
                  <Route
                    path="health/update-profile"
                    element={<UpdateProfileForm />}
                  />
                </Route>

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin-panel/*" element={<Admin />}>
                    <Route index element={<Navigate to="users" replace />} />
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

        {/* Log Panel */}
        {showLogs && <LogPanel onClose={() => setShowLogs(false)} />}
        <TouchHotspot tapsNeeded={5} onOpen={() => setShowLogs(true)} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
