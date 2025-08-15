import Header from "./Header";
import Footer from "./Footer";
import NetworkStatusBanner from "../components/NetworkStatusBanner";
import GlobalLoadingState from "../states/GlobalLoadingState";
import { useSearchParams } from "react-router-dom";

const Layout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const headerEnabled = searchParams.get("header") !== "false";
  const footerEnabled = searchParams.get("footer") !== "false";
  const spinnerEnabled = searchParams.get("spinner") !== "false";

  return (
    <>
      {spinnerEnabled && <GlobalLoadingState />}

      <div
        className={`min-h-screen flex flex-col ${
          headerEnabled ? "" : "pt-[var(--custom-header-size)]"
        }`}
      >
        {headerEnabled && <Header />}

        <main id="main-container" className={`flex-1 flex flex-col`}>
          {children}
        </main>
      </div>

      <NetworkStatusBanner />

      {footerEnabled && <Footer />}
    </>
  );
};

export default Layout;
