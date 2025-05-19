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
import Workouts from "./pages/Workouts";
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

              <Route path="/workouts" element={<Workouts />} />

              <Route path="/create-profile" element={<CreateProfileForm />} />
              <Route path="/update-profile" element={<UpdateProfileForm />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
