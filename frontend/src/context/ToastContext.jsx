import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ToastStack from "../components/ToastStack";

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);
  const closingRef = useRef(new Set());
  const EXIT_MS = 420;

  const removeToast = useCallback((id) => {
    if (closingRef.current.has(id)) return;
    closingRef.current.add(id);
    setToasts((list) =>
      list.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast
      )
    );

    window.setTimeout(() => {
      closingRef.current.delete(id);
      setToasts((list) => list.filter((toast) => toast.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 2800 } = {}) => {
      const id = `${Date.now()}-${counterRef.current++}`;
      const next = { id, title, message, type, closing: false };
      setToasts((list) => [...list, next]);

      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast: removeToast,
    }),
    [removeToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
