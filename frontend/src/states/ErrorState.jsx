import ErrorIcon from "../icons/ErrorIcon";

const ErrorState = ({
  message = "Unknown error occured.",
  onRetry, // Optional retry callback
}) => (
  <div className="card flex flex-col items-center justify-center">
    <div className="mb-5">
      <span className="inline-flex items-center justify-center bg-red-50 rounded-full p-4">
        <ErrorIcon />
      </span>
    </div>
    <h2 className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent text-2xl font-bold mb-2 text-center">
      Oops! Something went wrong
    </h2>
    <p className="text-gray-600 mb-6 text-center">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-danger">
        Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
