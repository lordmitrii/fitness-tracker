import SpinnerIcon from "../icons/SpinnerIcon";

const GlobalLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <SpinnerIcon />
      <p className="text-lg font-semibold text-blue-700 tracking-wide">
        Loading...
      </p>
      <span className="sr-only">Loading, please wait</span>
    </div>
  );
};

export default GlobalLoadingState;
