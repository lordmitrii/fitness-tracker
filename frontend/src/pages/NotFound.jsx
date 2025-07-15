import { Link } from "react-router-dom";
import WarningIcon from "../icons/WarningIcon";

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center max-w-4xl mx-auto mt-8">
        <div className="flex w-16 h-16 text-yellow-400 mb-4 justify-center items-center rounded-full bg-yellow-100">
          <WarningIcon />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          404
        </h1>
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
