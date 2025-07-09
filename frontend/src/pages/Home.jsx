import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";

const Home = () => {
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <LoadingState message="Loading your stats..." />;
  if (error)
    return (
      <ErrorState
        message={error?.message}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
          {isAuth ? "Welcome Back!" : "Welcome to Fitness Tracker"}
        </h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          {isAuth
            ? "You are logged in!"
            : "Please login or register to get started."}
        </p>
        <p className="text-sm text-gray-500 mb-6 text-center">
          This page has no purpose really (yet)
        </p>
      </div>
    </div>
  );
};

export default Home;
