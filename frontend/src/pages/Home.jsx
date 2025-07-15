import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { Link } from "react-router-dom";
import InstallIcon from "../icons/InstallIcon";

const Home = () => {
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <LoadingState message="Loading the home page..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="card flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
        {isAuth ? "Welcome Back!" : "Welcome to Fitness Tracker"}
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        {isAuth
          ? "You are logged in!"
          : "Please login or register to get started."}
      </p>
      <p className="text-sm text-gray-500 mb-6 text-center">
        This page has no purpose (yet)
      </p>

      {/* Install App Guide Link */}
      <Link to="/installation-guide" className="btn btn-primary">
        <span className="flex items-center gap-2">
          <InstallIcon />
          Install the App
        </span>
      </Link>
    </div>
  );
};

export default Home;
