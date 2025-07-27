import CheckIcon from "../icons/CheckIcon";

const CheckBox = ({ title, checked, onChange, disabled = false }) => {
  return (
    <label className="relative flex justify-center items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        title={title}
        disabled={disabled}
      />
      <div
        className={`size-6 bg-white dark:bg-gray-500 border border-gray-300 rounded transition duration-150 ease-in-out
                    peer-checked:bg-blue-600 peer-checked:border-transparent
                    peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400
                    flex items-center justify-center
                `}
      />

      <CheckIcon
        className={`absolute size-6 text-white hidden peer-checked:block`}
      />
    </label>
  );
};

export default CheckBox;
