import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";

const LoadingState = ({ message, subtitle }) => {
  const { t } = useTranslation();

  return (
    <div className="card flex flex-col items-center justify-center">
      <div className="mb-5">
        <span className="inline-flex items-center justify-center bg-blue-50 rounded-full p-4">
          <SpinnerIcon />
        </span>
      </div>
      <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
        {!!message ? message : t("general.loading")}
      </h2>
      {subtitle && <p className="text-gray-600 mb-1 text-center">{subtitle}</p>}
    </div>
  );
};

export default LoadingState;
