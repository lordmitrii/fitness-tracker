import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center max-w-2xl mx-auto mt-8">
        <div className="flex w-16 h-16 text-yellow-400 mb-4 justify-center items-center rounded-full bg-yellow-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-xl font-semibold text-gray-700 mb-2">
          Page Not Found
        </p>
        <p className="text-gray-500 mb-6 text-center">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}
export default NotFound;
