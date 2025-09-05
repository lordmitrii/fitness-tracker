import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const MAX_STANDARD_DAYS = 7;
const MAX_CUSTOM_DAYS = 14;

const DaysPerCycleSelector = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState(
    value > MAX_STANDARD_DAYS ? String(value) : String(MAX_STANDARD_DAYS + 1)
  );

  useEffect(() => {
    if (value > MAX_STANDARD_DAYS && value !== customValue) {
      setCustomValue(String(value));
    }
  }, [value]);

  const handleMoreClick = () => {
    setShowCustomInput(true);
    setCustomValue(value > MAX_STANDARD_DAYS ? value : MAX_STANDARD_DAYS + 1);
    if (value <= MAX_STANDARD_DAYS) {
      onChange(MAX_STANDARD_DAYS + 1);
    }
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (val === "") {
      setCustomValue("");
      onChange(0);
      return;
    }
    val = parseInt(val, 10);
    if (val > MAX_CUSTOM_DAYS) val = MAX_CUSTOM_DAYS;

    setCustomValue(val);
    onChange(val);
  };

  return (
    <div>
      <div className="flex w-full overflow-x-auto justify-between bg-gray-100 rounded-2xl p-1 sm:p-2 shadow-inner">
        {[...Array(MAX_STANDARD_DAYS)].map((_, i) => (
          <button
            key={i}
            type="button"
            className={`px-3 sm:px-6 py-2 rounded-xl font-medium transition ${
              value === i + 1
                ? "bg-blue-600 text-white shadow-md scale-105"
                : "bg-white text-body hover:bg-blue-100"
            }`}
            onClick={() => {
              onChange(i + 1);
              setShowCustomInput(false);
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          className={`px-4 py-2 rounded-xl font-medium transition shadow-lg ${
            value > MAX_STANDARD_DAYS
              ? "bg-blue-600 text-white shadow-md scale-105"
              : "bg-white text-body hover:bg-blue-100"
          }`}
          onClick={handleMoreClick}
        >
          {t("days_per_cycle_selector.more")}
        </button>
      </div>
      {showCustomInput && (
        <div className="flex items-center gap-2 mt-3 justify-center">
          <div className="w-20">
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_DAYS}
              value={customValue}
              onChange={handleInputChange}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("days_per_cycle_selector.days")}
              className="input-style text-center"
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowCustomInput(false);
              onChange(MAX_STANDARD_DAYS);
            }}
          >
            {t("general.cancel")}
          </button>
        </div>
      )}
    </div>
  );
};

export default DaysPerCycleSelector;
