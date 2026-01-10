import NetworkStatusBanner from "../components/NetworkStatusBanner";
import GlobalLoadingState from "../states/GlobalLoadingState";
import { useSearchParams } from "react-router-dom";
import MenuPanel from "../components/MenuPanel";
import MoreAside from "../components/more/MoreAside";
import { useState, useMemo, useRef, useEffect } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import usePullToRefresh from "../hooks/usePullToRefresh";
import { HeaderContext } from "./LayoutHeader";
import PullToRefreshPill from "../components/PullToRefreshPill";
import {
  PullToRefreshProvider,
  usePullToRefreshContext,
} from "../context/PullToRefreshContext";
import { useCacheWarmup } from "../hooks/useCacheWarmup";
import useKeyboardVisible from "../hooks/useKeyboardVisible";

function ScrollAreaWithPTR({ children }) {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const { _activeHandlerRef } = usePullToRefreshContext();

  const { offset, status, THRESHOLD } = usePullToRefresh(scrollRef, () => {
    _activeHandlerRef.current?.();
  });

  const pulling = status === "pull" || status === "ready";
  const refreshing = status === "refreshing";
  const progress = Math.min(1, offset / THRESHOLD);

  return (
    <>
      <main
        className="flex-1 basis-0 min-w-0 min-h-0 flex flex-col overflow-hidden focus:outline-none bg-gray-200"
        tabIndex={-1}
      >
        <div
          ref={scrollRef}
          className="
          flex-1 min-h-0 overflow-y-auto 
          overscroll-contain
          touch-pan-y
          [--webkit-overflow-scrolling:touch]
          relative
        "
        >
          <PullToRefreshPill
            className="ptr-pill"
            progress={progress}
            status={status}
          />
          <div
            style={{
              height: offset,
              transition:
                pulling || refreshing
                  ? "none"
                  : "height 420ms cubic-bezier(.22,1,.36,1)",
            }}
          />
          <div id="main-container" className="min-h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px origin-top scale-y-50 bg-gray-300" />
      </div>
    </>
  );
}

const Layout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const keyboardVisible = useKeyboardVisible({ threshold: 150 });
  const spinnerEnabled = searchParams.get("spinner") !== "false";
  const isNewSession = sessionStorage.getItem("hasLoaded") !== "1";
  const warmupDone = useCacheWarmup({
    enable: spinnerEnabled && isNewSession,
    minDelayMs: 1500,
    timeoutMs: 3000,
  });

  useEffect(() => {
    const docEl = document.documentElement;
    const vv = window.visualViewport;

    const updateViewportHeight = () => {
      const height =
        (vv && vv.height) ||
        window.innerHeight ||
        (docEl ? docEl.clientHeight : 0);

      if (height) {
        docEl.style.setProperty("--viewport-height", `${Math.round(height)}px`);
      }
    };

    updateViewportHeight();

    vv && vv.addEventListener("resize", updateViewportHeight);
    vv && vv.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      vv && vv.removeEventListener("resize", updateViewportHeight);
      vv && vv.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    console.log(
      "[layout] warmupDone",
      warmupDone,
      "spinnerEnabled",
      spinnerEnabled
    );
  }, [warmupDone, spinnerEnabled]);

  const [headerConfig, setHeaderNode] = useState(null);
  const ctxValue = useMemo(() => ({ setHeader: setHeaderNode }), []);

  return (
    <PullToRefreshProvider>
      {spinnerEnabled && isNewSession && (
        <GlobalLoadingState blocking={!warmupDone} />
      )}

      <HeaderContext.Provider value={ctxValue}>
        <div
          className="flex flex-col overflow-hidden bg-white h-[calc(100dvh-var(--safe-area-top))]
          mt-[calc(var(--safe-area-top))]"
        >
          <NetworkStatusBanner />

          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            <MoreAside />

            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              {headerConfig && (
                <div
                  className={`bg-white ${
                    !headerConfig.disablePaddingBottom && "pb-[1rem]"
                  } pt-[max(calc(1rem-var(--safe-area-top)),_0px)] sm:pt-4`}
                >
                  {headerConfig.node}
                </div>
              )}

              <ScrollAreaWithPTR>{children}</ScrollAreaWithPTR>
            </div>
          </div>
          <div className={`sm:hidden ${keyboardVisible ? "hidden" : ""}`}>
            <MenuPanel />
          </div>
        </div>
      </HeaderContext.Provider>
    </PullToRefreshProvider>
  );
};

export default Layout;
