import { createPortal } from "react-dom";

const tone = {
  success: {
    accent: "bg-green-500",
    glow: "shadow-[0_8px_24px_-14px_rgba(16,185,129,0.25)]",
    chipBg: "bg-green-500",
    chipText: "text-white",
    text: "text-green-700",
  },
  error: {
    accent: "bg-red-500",
    glow: "shadow-[0_8px_24px_-14px_rgba(239,68,68,0.25)]",
    chipBg: "bg-red-500",
    chipText: "text-white",
    text: "text-red-700",
  },
  info: {
    accent: "bg-blue-500",
    glow: "shadow-[0_8px_24px_-14px_rgba(59,130,246,0.25)]",
    chipBg: "bg-blue-500",
    chipText: "text-white",
    text: "text-blue-700",
  },
};

const Icon = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case "error":
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 9l-6 6m0-6l6 6" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    default:
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      );
  }
};

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts?.length) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[1200] flex justify-center px-4 sm:px-0">
      <div className="flex w-full max-w-md flex-col gap-3">
        {toasts.map(({ id, title, message, type, closing }) => {
          const color = tone[type] ?? tone.info;
          return (
            <div
              key={id}
              className={`pointer-events-auto overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 ring-1 ring-black/5 ${color.glow} ${
                closing ? "animate-toast-out" : "animate-slide-down-in"
              }`}
            >
              <div className={`h-1 w-full ${color.accent}`} />
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${color.chipBg} ${color.chipText} ring-1 ring-black/5`}
                >
                  <Icon type={type} />
                </span>
                <div className="flex-1">
                  {title && (
                    <div className={`text-sm font-semibold ${color.text}`}>
                      {title}
                    </div>
                  )}
                  {message && (
                    <div className="text-sm text-gray-700">{message}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Dismiss toast"
                  onClick={() => onDismiss(id)}
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

export default ToastStack;
