import Spinner from "../components/Spinner";

const LoadingState = ({ message = "Loading…", subtitle }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2">
    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md w-full">
      <div className="mb-5">
        <Spinner />
      </div>
      <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
        {message}
      </h2>
      {subtitle && <p className="text-gray-600 mb-1 text-center">{subtitle}</p>}
    </div>
  </div>
);

export default LoadingState;
