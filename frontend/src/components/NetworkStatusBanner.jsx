import { OfflineStatusIcon, OnlineStatusIcon } from "../icons/WifiIcon";
import useNetworkBanner from "../hooks/useNetworkBanner";

const OfflineBanner = () => (
  <div className="fixed inset-x-0 bottom-5 z-[9999] flex items-center justify-center mx-auto w-95 px-5 py-3 rounded-2xl shadow-lg btn-danger animate-slide-up gap-1">
    <OfflineStatusIcon />
    <span className="font-semibold text-white">You are offline.</span>
  </div>
);

const OnlineBanner = () => (
  <div className="fixed inset-x-0 bottom-5 z-[9999] flex items-center justify-center mx-auto w-95 px-5 py-3 rounded-2xl shadow-lg btn-success animate-slide-down gap-1">
    <OnlineStatusIcon />
    <span className="font-semibold text-white">You are online!</span>
  </div>
);

export const NetworkStatusBanner = () => {
  const { online, showOnline } = useNetworkBanner();
  if (!online) return <OfflineBanner />;
  if (showOnline) return <OnlineBanner />;
  return null;
};

export default NetworkStatusBanner;
