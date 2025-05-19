import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-semibold text-gray-800 hover:text-blue-600"
          >
            Fitness Tracker
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-800 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Navigation links */}
          <nav
            className={`${
              isOpen ? "flex flex-col items-center" : "hidden"
            } md:flex md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 md:mt-0`}
          >
            <Link
              to="/"
              className="block text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {token ? (
              <>
                <Link
                  to="/workouts"
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Workouts
                </Link>
                <Link
                  to="/profile"
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-left md:text-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block md:inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">{children}</main>

      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Fitness Tracker
        </div>
      </footer>
    </div>
  );
};

export default Layout;