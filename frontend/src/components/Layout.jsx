import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Home", auth: null },
  { to: "/workout-plans", label: "Workouts", auth: true },
  { to: "/exercise-stats", label: "Stats", auth: true },
  { to: "/profile", label: "Profile", auth: true },
  { to: "/login", label: "Login", auth: false },
  { to: "/register", label: "Register", auth: false },
];

const Layout = ({ children }) => {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="backdrop-blur-xl bg-white/80 shadow-md sticky top-0 z-80">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-blue-500 to-blue-700 bg-clip-text text-transparent"
          >
            Fitness Tracker
          </Link>

          {/* Hamburger */}
          <button
            className="sm:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition group"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Open main menu"
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "rotate-45 translate-y-0" : "-translate-y-2.5"}
              `}
              />
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "opacity-0" : ""}
              `}
              />
              <span
                className={`absolute left-0 top-1/2 w-6 h-0.5 bg-gray-800 rounded transition-all duration-300
                ${isOpen ? "-rotate-45 translate-y-0" : "translate-y-2.5"}
              `}
              />
            </div>
          </button>

          {/* Navigation */}
          <nav
            className={`
              fixed sm:static top-16 left-0 w-full sm:w-auto sm:bg-transparent bg-white/95 sm:backdrop-blur-0 backdrop-blur-lg z-70
              shadow-lg sm:shadow-none
              flex-col sm:flex-row flex sm:flex sm:items-center
              gap-2 sm:gap-5
              px-6 py-5 sm:p-0
              rounded-b-2xl sm:rounded-none
              transition-all duration-300
              ${isOpen ? "flex" : "hidden sm:flex"}
            `}
          >
            {navLinks
              .filter((l) => l.auth === null || l.auth === isAuth)
              .map(({ to, label }) =>
                label === "Register" ? (
                  <Link
                    key={to}
                    to={to}
                    className="hidden sm:inline-block font-semibold bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                ) : label === "Login" ? (
                  <Link
                    key={to}
                    to={to}
                    className={`font-semibold px-3 py-2 rounded-lg ${
                      isActive(to)
                        ? "text-blue-700 bg-blue-100"
                        : "text-gray-700 hover:bg-blue-50"
                    } transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                ) : (
                  <Link
                    key={to}
                    to={to}
                    className={`font-semibold px-3 py-2 rounded-lg ${
                      isActive(to)
                        ? "text-blue-700 bg-blue-100"
                        : "text-gray-700 hover:bg-blue-50"
                    } transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                )
              )}
            {isAuth && (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="btn btn-danger"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto">{children}</main>

      <footer className="bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-inner py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left text-sm font-medium tracking-wide">
            &copy; {new Date().getFullYear()} Fitness Tracker &mdash; All Rights
            Reserved
          </div>
          <div className="flex items-center space-x-4 text-lg">
            <a
              href="https://github.com/lordmitrii"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.425 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.605-3.369-1.34-3.369-1.34-.454-1.153-1.109-1.461-1.109-1.461-.907-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.528 2.341 1.087 2.91.832.092-.646.35-1.087.636-1.338-2.222-.254-4.555-1.112-4.555-4.951 0-1.093.39-1.988 1.029-2.687-.104-.254-.446-1.274.098-2.656 0 0 .84-.27 2.75 1.025A9.54 9.54 0 0 1 12 6.844c.85.004 1.705.115 2.504.338 1.909-1.296 2.748-1.025 2.748-1.025.546 1.382.204 2.402.1 2.656.64.699 1.028 1.594 1.028 2.687 0 3.849-2.336 4.695-4.566 4.945.359.308.679.92.679 1.854 0 1.338-.013 2.419-.013 2.749 0 .267.18.578.688.48C19.138 20.2 22 16.442 22 12.021 22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            {/* Add more icons/links as you like */}
            <a
              href="mailto:dmitrii.lor@glasgow.ac.uk"
              className="hover:text-blue-300 transition text-base"
              aria-label="Contact Support"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
