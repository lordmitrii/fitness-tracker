// Stepper.jsx
const Stepper = ({ step, total, onStepClick }) => (
  <div className="flex items-center justify-center mb-4 w-full gap-1">
    {Array.from({ length: total }, (_, i) => {
      const stepNumber = i + 1;

      return (
        <button
          key={i}
          type="button"
          className={"h-6 w-full mx-1"}
          onClick={() => onStepClick && onStepClick(stepNumber)}
        >
          <div
            className={`h-2 w-full rounded-full transition-all outline-none duration-300
            ${
              stepNumber === step
                ? "bg-blue-500 scale-y-150 shadow"
                : stepNumber > step
                ? "bg-gray-300"
                : "bg-blue-300 hover:bg-blue-400 cursor-pointer"
            }
            `}
          />
        </button>
      );
    })}
  </div>
);

export default Stepper;
