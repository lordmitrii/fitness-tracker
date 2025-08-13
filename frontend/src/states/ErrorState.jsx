import ErrorIcon from "../icons/ErrorIcon";
import { useTranslation } from "react-i18next";

const ErrorState = ({
  error,
  onRetry, // Optional retry callback
}) => {
  const { t } = useTranslation();
  const errorMessage =
    typeof error === "string"
      ? error
      : error?.response?.data?.message ||
        error?.message ||
        error?.response?.data ||
        t("error_state.unknown_error");
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
      <p className="text-caption mb-6 text-center">{errorMessage}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-danger">
          {t("error_state.try_again")}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
