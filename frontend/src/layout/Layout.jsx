import NetworkStatusBanner from "../components/NetworkStatusBanner";
import GlobalLoadingState from "../states/GlobalLoadingState";
import { useSearchParams } from "react-router-dom";
import MenuPanel from "../components/MenuPanel";
import MoreAside from "../components/more/MoreAside";
import { useState, useMemo, useRef } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import { HeaderContext } from "./LayoutHeader";

const Layout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const spinnerEnabled = searchParams.get("spinner") !== "false";

  const [headerNode, setHeaderNode] = useState(null);
  const ctxValue = useMemo(() => ({ setHeader: setHeaderNode }), []);

  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  return (
    <>
      {spinnerEnabled && <GlobalLoadingState />}

      <HeaderContext.Provider value={ctxValue}>
        <div className="flex h-dvh min-h-screen flex-col overflow-hidden pt-[env(safe-area-inset-top)] bg-white">
          <NetworkStatusBanner />

          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            <MoreAside />

            <main
              className="flex-1 basis-0 min-w-0 min-h-0 flex flex-col overflow-hidden focus:outline-none bg-gray-200"
              tabIndex={-1}
            >
              {headerNode && (
                <div className="bg-white pb-[1rem] pt-[max(calc(1rem-env(safe-area-inset-top)),_0px)] sm:pt-4">
                  {headerNode}
                </div>
              )}

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
                <div id="main-container" className="min-h-full flex flex-col">
                  {children}
                </div>
              </div>
            </main>
          </div>

          <div className="sm:hidden">
            <MenuPanel />
          </div>
        </div>
      </HeaderContext.Provider>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px origin-top scale-y-50 bg-gray-300" />
      </div>
    </>
  );
};

export default Layout;
