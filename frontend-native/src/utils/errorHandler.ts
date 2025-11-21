import { Alert, Platform } from "react-native";
import { nativeAlerts } from "./nativeAlerts";

export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  isOffline?: boolean;
  isTimeout?: boolean;
}

export function extractErrorInfo(error: unknown): ErrorInfo {
  if (!error) {
    return { message: "An unknown error occurred" };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        error?: string;
      };
    };
    isOffline?: boolean;
    isTimeout?: boolean;
    code?: string;
  };

  const message =
    err?.response?.data?.message ||
    (typeof err?.response?.data?.error === "string" ? err.response.data.error : null) ||
    err?.message ||
    "An unknown error occurred";

  return {
    message,
    code: err?.code,
    status: err?.response?.status,
    isOffline: err?.isOffline,
    isTimeout: err?.isTimeout,
  };
}

export function showErrorAlert(
  error: unknown,
  options?: {
    title?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
  }
) {
  const errorInfo = extractErrorInfo(error);
  const { title = "Error", onRetry, onDismiss } = options || {};

  if (errorInfo.isOffline) {
    nativeAlerts.error(
      title,
      "You are currently offline. Please check your internet connection.",
      onDismiss
    );
    return;
  }

  if (errorInfo.isTimeout) {
    nativeAlerts.error(
      title,
      "The request timed out. Please try again.",
      onRetry || onDismiss
    );
    return;
  }

  nativeAlerts.error(title, errorInfo.message, onDismiss);
}

export function handleApiError(
  error: unknown,
  options?: {
    showAlert?: boolean;
    onRetry?: () => void;
    fallbackMessage?: string;
  }
): ErrorInfo {
  const errorInfo = extractErrorInfo(error);
  const { showAlert = false, onRetry, fallbackMessage } = options || {};

  if (showAlert) {
    showErrorAlert(error, {
      title: "Error",
      onRetry,
    });
  }

  return errorInfo;
}


