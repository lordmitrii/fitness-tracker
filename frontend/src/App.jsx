import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import LoginForm from "./forms/LoginForm";
import RegisterForm from "./forms/RegisterForm";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { CreateProfileForm, UpdateProfileForm } from "./forms/ProfileForm";
import AddWorkoutPlanForm from "./forms/AddWorkoutPlanForm";
import UpdateWorkoutPlanForm from "./forms/UpdateWorkoutPlanForm";
import { CreateWorkoutForm, UpdateWorkoutForm } from "./forms/WorkoutForm";
import WorkoutPlans from "./pages/WorkoutPlans";
import WorkoutPlanSingle from "./pages/WorkoutPlanSingle";
import ExerciseStats from "./pages/ExerciseStats";
import AIChat from "./pages/AIChat";
import PrivateRoute from "./components/PrivateRoute";
import InstallationGuide from "./pages/InstallationGuide";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HealthDataPolicy from "./pages/HealthDataPolicy";
import ForgotPassword from "./forms/ForgotPassword";
import ResetPassword from "./forms/ResetPassword";
import ScrollToTop from "./utils/scrollToTop";
import "./i18n";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
