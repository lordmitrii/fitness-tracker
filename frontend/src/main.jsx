import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// diagnostics
import { logStore } from "./diagnostics/LogStore";
import { installGlobalErrorHooks } from "./diagnostics/installGlobalErrorHooks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

registerSW({
  onNeedRefresh() {
    console.info("[SW]: update available");
    // logStore.push({ level: "info", msg: "PWA update available" });
  },
  onOfflineReady() {
    console.info("[SW]: offline ready");
    // logStore.push({ level: "info", msg: "App ready to work offline" });
  },
});

if (!window.__DIAG_ERR_HOOKS__) {
  installGlobalErrorHooks((e) => logStore.push(e));
  window.__DIAG_ERR_HOOKS__ = true;
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (ev) => {
    if (ev.data && ev.data.__log) {
      logStore.push(ev.data.__log);
    }
  });
}

const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : () => null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>
);
