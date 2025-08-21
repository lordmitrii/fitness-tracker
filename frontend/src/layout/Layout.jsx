import NetworkStatusBanner from "../components/NetworkStatusBanner";
import GlobalLoadingState from "../states/GlobalLoadingState";
import { useSearchParams } from "react-router-dom";
import MenuPanel from "../components/MenuPanel";
import MoreAside from "../components/more/MoreAside";
import { useState, useMemo, useRef } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import usePullToRefresh from "../hooks/usePullToRefresh";
import { HeaderContext } from "./LayoutHeader";
import PullToRefreshPill from "../components/PullToRefreshPill";
import {
  PullToRefreshProvider,
  usePullToRefreshContext,
} from "../context/PullToRefreshContext";

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
          relative scroll-stable
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
  const spinnerEnabled = searchParams.get("spinner") !== "false";

  const [headerConfig, setHeaderNode] = useState(null);
  const ctxValue = useMemo(() => ({ setHeader: setHeaderNode }), []);

  return (
    <PullToRefreshProvider>
      {spinnerEnabled && <GlobalLoadingState />}

      <HeaderContext.Provider value={ctxValue}>
        <div className="flex h-dvh min-h-screen flex-col overflow-hidden pt-[env(safe-area-inset-top)] bg-white">
          <NetworkStatusBanner />

          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            <MoreAside />

            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              {headerConfig && (
                <div
                  className={`bg-white ${
                    !headerConfig.disablePaddingBottom && "pb-[1rem]"
                  } pt-[max(calc(1rem-env(safe-area-inset-top)),_0px)] sm:pt-4`}
                >
                  {headerConfig.node}
                </div>
              )}

              <ScrollAreaWithPTR>{children}</ScrollAreaWithPTR>
            </div>
          </div>

          <div className="sm:hidden">
            <MenuPanel />
          </div>
        </div>
      </HeaderContext.Provider>
    </PullToRefreshProvider>
  );
};

export default Layout;
