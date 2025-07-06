import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuth } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col items-center">
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
