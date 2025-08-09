import Header from "./Header";
import Footer from "./Footer";
import NetworkStatusBanner from "../components/NetworkStatusBanner";
import GlobalLoadingState from "../states/GlobalLoadingState";

const Layout = ({ children }) => {
  return (
    <>
      <GlobalLoadingState />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-container" className="flex-1 flex flex-col pb-2">
          {children}
        </main>
      </div>

      <NetworkStatusBanner />

      <Footer />
    </>
  );
};

export default Layout;
