const ErrorState = ({
  message = "Unknown error occured.",
  onRetry, // Optional retry callback
}) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2">
    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-full">
      <div className="mb-5">
        <span className="inline-flex items-center justify-center bg-red-50 rounded-full p-4">
          <svg
            className="h-10 w-10 text-pink-400 animate-shake"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01"
            />
          </svg>
        </span>
      </div>
      <h2 className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent text-2xl font-bold mb-2 text-center">
        Oops! Something went wrong
      </h2>
      <p className="text-gray-600 mb-6 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-danger"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
