import React from "react";

const LoadingState = ({ message = "Loading…", subtitle }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2">
    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-full">
      <div className="mb-5">
        <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
          <svg
            className="h-10 w-10 text-blue-500 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </span>
      </div>
      <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
        {message}
      </h2>
      {subtitle && <p className="text-gray-600 mb-1 text-center">{subtitle}</p>}
    </div>
  </div>
);

export default LoadingState;
