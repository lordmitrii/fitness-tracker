import ErrorIcon from "../icons/ErrorIcon";
import { useTranslation } from "react-i18next";

const ErrorState = ({
  message,
  onRetry, // Optional retry callback
}) => {
  const { t } = useTranslation();
  return (
    <div className="card flex flex-col items-center justify-center">
      <div className="mb-5">
        <span className="inline-flex items-center justify-center bg-red-50 rounded-full p-4">
          <ErrorIcon />
        </span>
      </div>
      <h1 className="text-title-red-gradient font-bold mb-2 text-center">
        {t("error_state.oops_message")}
      </h1>
      <p className="text-caption mb-6 text-center">
        {!!message ? message : t("error_state.unknown_error")}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-danger">
          {t("error_state.try_again")}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
