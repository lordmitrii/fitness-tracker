import {
  createContext,
  useContext,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";

const PullToRefreshContext = createContext(null);

export function PullToRefreshProvider({ children }) {
  const defaultHandler = useCallback(() => {
    requestAnimationFrame(() => {
      // window.location.reload(true); disabled by default 
    });
  }, []);

  const activeHandlerRef = useRef(defaultHandler);

  const setHandler = useCallback(
    (fn) => {
      const current = fn || defaultHandler;
      activeHandlerRef.current = current;
      return () => {
        if (activeHandlerRef.current === current) {
          activeHandlerRef.current = defaultHandler;
        }
      };
    },
    [defaultHandler]
  );

  const refresh = useCallback(() => {
    activeHandlerRef.current?.();
  }, []);

  const location = useLocation();
  useEffect(() => {
    activeHandlerRef.current = defaultHandler;
  }, [location.pathname, defaultHandler]);

  const value = useMemo(
    () => ({
      refresh,
      setHandler,
      _activeHandlerRef: activeHandlerRef,
    }),
    [refresh, setHandler]
  );

  return (
    <PullToRefreshContext.Provider value={value}>
      {children}
    </PullToRefreshContext.Provider>
  );
}

export function usePullToRefreshContext() {
  const ctx = useContext(PullToRefreshContext);
  if (!ctx) {
    throw new Error(
      "usePullToRefreshContext must be used inside <PullToRefreshProvider>"
    );
  }
  return ctx;
}

export function usePullToRefreshOverride(fn) {
  const { setHandler } = usePullToRefreshContext();
  useEffect(() => setHandler(fn), [setHandler, fn]);
}
