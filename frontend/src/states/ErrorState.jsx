import { useMemo, useState } from "react";
import ErrorIcon from "../icons/ErrorIcon";
import { useTranslation } from "react-i18next";
import { copyText } from "../utils/copyText";

const pickMessage = (error, t) => {
  if (!error) return t("error_state.unknown_error");
  if (typeof error === "string") return error;
  return (
    error?.response?.data?.message ??
    error?.message ??
    (typeof error?.response?.data === "string" ? error.response.data : null) ??
    t("error_state.unknown_error")
  );
};

const buildDetails = (error) => {
  try {
    if (!error || typeof error === "string") return null;

    const isAxios = !!error.isAxiosError || !!error.config || !!error.response;
    if (isAxios) {
      return {
        type: "AxiosError",
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack ?? null,
      };
    }

    if (error instanceof Error || error?.message || error?.stack) {
      return {
        type: error.name || "Error",
        message: error.message,
        stack: error.stack ?? null,
      };
    }

    return { type: typeof error, value: error };
  } catch {
    return null;
  }
};

const ErrorState = ({ error, onRetry }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = useMemo(() => pickMessage(error, t), [error, t]);
  const details = useMemo(() => buildDetails(error), [error]);

  const isUnknown = message === t("error_state.unknown_error") && !details;

  const handleCopy = async () => {
    const payload = JSON.stringify(
      {
        message: String(message),
        details,
        ua: navigator.userAgent,
      },
      null,
      2
    );

    const success = await copyText(payload);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

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

      <p className="text-caption mb-4 text-center">{message}</p>

      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          {onRetry && (
            <button onClick={onRetry} className="btn btn-danger w-full">
              {t("error_state.try_again")}
            </button>
          )}

          <button onClick={handleCopy} className="btn btn-secondary w-full">
            {copied
              ? t("error_state.copied_success")
              : t("error_state.copy_report")}
          </button>
        </div>

        {!isUnknown && details && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto underline underline-offset-4 text-caption"
          >
            {open
              ? t("error_state.hide_details")
              : t("error_state.show_details")}
          </button>
        )}
      </div>

      {open && details && (
        <div className="mt-4 rounded-lg border border-gray-300 p-3 select-auto w-full bg-gray-200">
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-black m-0">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
